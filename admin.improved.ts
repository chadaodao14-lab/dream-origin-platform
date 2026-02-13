import { router, protectedProcedure } from "./routers";
import { z } from "zod";
import { getDb } from "./db";
import { 
  users, 
  deposits, 
  commissions, 
  assets, 
  fundFlows,
  activationLogs,
  depositVerifications 
} from "./schema.extended";
import { eq, and, gte, lte } from "drizzle-orm";
import { logger } from "./logger";
import { BusinessError, ValidationError, NotFoundError } from "./errors";
import { asyncHandler } from "./errorHandler";

/**
 * 管理员后台路由 - 改进版
 * 包含完整的入金激活管理、审计追踪等功能
 */
export const adminRouter = router({
  /**
   * 获取平台统计数据
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // 获取用户统计数据
    const usersResult = await db.select().from(users);
    const totalUsers = usersResult.length;
    const activatedUsers = usersResult.filter(u => u.isActivated).length;

    // 获取入金统计数据
    const depositsResult = await db.select().from(deposits);
    const totalDeposits = depositsResult.length;
    const confirmedDeposits = depositsResult.filter(d => d.status === "confirmed").length;
    const totalDepositAmount = depositsResult
      .filter(d => d.status === "confirmed")
      .reduce((sum, d) => sum + parseFloat(d.amount?.toString() || "0"), 0);

    // 获取分润统计数据
    const commissionsResult = await db.select().from(commissions);
    const totalCommissions = commissionsResult.reduce((sum, c) => sum + parseFloat(c.amount?.toString() || "0"), 0);

    return {
      totalUsers,
      activatedUsers,
      totalDeposits,
      confirmedDeposits,
      totalDepositAmount,
      totalCommissions,
    };
  }),

  /**
   * 获取用户列表
   */
  getUserList: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(10),
        status: z.enum(["all", "activated", "inactive"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const offset = (input.page - 1) * input.pageSize;
      
      let whereClause = undefined;
      if (input.status === "activated") {
        whereClause = eq(users.isActivated, true);
      } else if (input.status === "inactive") {
        whereClause = eq(users.isActivated, false);
      }

      const usersResult = await db
        .select()
        .from(users)
        .where(whereClause)
        .limit(input.pageSize)
        .offset(offset);

      const totalResult = await db
        .select()
        .from(users)
        .where(whereClause);

      return {
        list: usersResult,
        total: totalResult.length,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  /**
   * 激活用户 - 完善版
   * 实现完整的激活逻辑和审计追踪
   */
  activateUser: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 获取用户信息
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!userResult.length) {
        throw new NotFoundError("User not found");
      }

      const user = userResult[0];

      // 检查用户是否已经激活
      if (user.isActivated) {
        throw new BusinessError("User is already activated");
      }

      // 检查用户是否有确认的入金记录
      const depositsResult = await db
        .select()
        .from(deposits)
        .where(and(
          eq(deposits.userId, input.userId),
          eq(deposits.status, "confirmed")
        ));

      if (!depositsResult.length) {
        throw new BusinessError("User has no confirmed deposits");
      }

      // 计算总入金额度
      const totalDepositAmount = depositsResult.reduce(
        (sum, d) => sum + parseFloat(d.amount?.toString() || "0"),
        0
      );

      // 验证最低入金额度 (300 USD)
      if (totalDepositAmount < 300) {
        throw new BusinessError("Insufficient deposit amount. Minimum required: $300");
      }

      try {
        // 开始事务
        await db.transaction(async (tx) => {
          // 1. 更新用户激活状态
          await tx
            .update(users)
            .set({
              isActivated: true,
              updatedAt: new Date(),
            })
            .where(eq(users.id, input.userId));

          // 2. 初始化用户资产（如果不存在）
          const assetsResult = await tx
            .select()
            .from(assets)
            .where(eq(assets.userId, input.userId))
            .limit(1);

          if (!assetsResult.length) {
            await tx.insert(assets).values({
              userId: input.userId,
              availableBalance: "0",
              frozenBalance: "0",
              totalCommission: "0",
              monthlyIncome: "0",
            });
          }

          // 3. 记录激活日志
          await tx.insert(activationLogs).values({
            userId: input.userId,
            status: "activated",
            reason: input.reason || "Manual activation by admin",
            operatedBy: ctx.user.id,
            metadata: JSON.stringify({
              totalDepositAmount,
              depositCount: depositsResult.length,
              activatedBy: ctx.user.id,
              activatedAt: new Date().toISOString(),
            }),
          });

          // 4. 记录操作日志
          logger.info("User activated", {
            userId: input.userId,
            activatedBy: ctx.user.id,
            totalDepositAmount,
            reason: input.reason,
          });
        });

        return {
          success: true,
          message: "User activated successfully",
          data: {
            userId: input.userId,
            totalDepositAmount,
            activatedAt: new Date().toISOString(),
          },
        };
      } catch (error) {
        logger.error("Failed to activate user", error, {
          userId: input.userId,
          operatedBy: ctx.user.id,
        });
        throw error;
      }
    }),

  /**
   * 确认入金 - 新增功能
   */
  confirmDeposit: protectedProcedure
    .input(
      z.object({
        depositId: z.number(),
        remark: z.string().optional(),
        skipVerification: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 获取入金记录
      const depositResult = await db
        .select()
        .from(deposits)
        .where(eq(deposits.id, input.depositId))
        .limit(1);

      if (!depositResult.length) {
        throw new NotFoundError("Deposit not found");
      }

      const deposit = depositResult[0];

      // 验证入金状态
      if (deposit.status !== "pending") {
        throw new BusinessError(`Deposit is not in pending status. Current status: ${deposit.status}`);
      }

      try {
        await db.transaction(async (tx) => {
          // 1. 更新入金状态
          await tx
            .update(deposits)
            .set({
              status: "confirmed",
              confirmedBy: ctx.user.id,
              confirmationRemark: input.remark,
              confirmedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(deposits.id, input.depositId));

          // 2. 如果是首次入金，激活用户
          const userResult = await tx
            .select()
            .from(users)
            .where(eq(users.id, deposit.userId))
            .limit(1);

          if (userResult.length && !userResult[0].isActivated) {
            const userDeposits = await tx
              .select()
              .from(deposits)
              .where(and(
                eq(deposits.userId, deposit.userId),
                eq(deposits.status, "confirmed")
              ));

            const totalAmount = userDeposits.reduce(
              (sum, d) => sum + parseFloat(d.amount?.toString() || "0"),
              0
            );

            if (totalAmount >= 300) {
              await tx
                .update(users)
                .set({
                  isActivated: true,
                  updatedAt: new Date(),
                })
                .where(eq(users.id, deposit.userId));

              // 初始化资产
              await tx.insert(assets).values({
                userId: deposit.userId,
                availableBalance: "0",
                frozenBalance: "0",
                totalCommission: "0",
                monthlyIncome: "0",
              });

              // 记录激活日志
              await tx.insert(activationLogs).values({
                userId: deposit.userId,
                status: "activated",
                reason: "Auto-activated by first deposit confirmation",
                operatedBy: ctx.user.id,
                metadata: JSON.stringify({
                  depositId: input.depositId,
                  amount: deposit.amount,
                  totalAmount,
                }),
              });
            }
          }

          // 3. 记录验证信息（如果需要）
          if (!input.skipVerification) {
            await tx.insert(depositVerifications).values({
              depositId: input.depositId,
              verificationMethod: "manual",
              verificationResult: true,
              verificationDetails: JSON.stringify({
                verifiedBy: ctx.user.id,
                remark: input.remark,
                timestamp: new Date().toISOString(),
              }),
              verifiedBy: ctx.user.id,
            });
          }

          // 4. 记录操作日志
          logger.info("Deposit confirmed", {
            depositId: input.depositId,
            userId: deposit.userId,
            amount: deposit.amount,
            confirmedBy: ctx.user.id,
            remark: input.remark,
          });
        });

        return {
          success: true,
          message: "Deposit confirmed successfully",
          data: {
            depositId: input.depositId,
            status: "confirmed",
            confirmedAt: new Date().toISOString(),
          },
        };
      } catch (error) {
        logger.error("Failed to confirm deposit", error, {
          depositId: input.depositId,
          operatedBy: ctx.user.id,
        });
        throw error;
      }
    }),

  /**
   * 拒绝入金 - 新增功能
   */
  rejectDeposit: protectedProcedure
    .input(
      z.object({
        depositId: z.number(),
        reason: z.string().min(1, "Reason is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 获取入金记录
      const depositResult = await db
        .select()
        .from(deposits)
        .where(eq(deposits.id, input.depositId))
        .limit(1);

      if (!depositResult.length) {
        throw new NotFoundError("Deposit not found");
      }

      const deposit = depositResult[0];

      // 验证入金状态
      if (deposit.status !== "pending") {
        throw new BusinessError(`Deposit is not in pending status. Current status: ${deposit.status}`);
      }

      try {
        await db.transaction(async (tx) => {
          // 1. 更新入金状态
          await tx
            .update(deposits)
            .set({
              status: "rejected",
              rejectedBy: ctx.user.id,
              rejectionReason: input.reason,
              updatedAt: new Date(),
            })
            .where(eq(deposits.id, input.depositId));

          // 2. 记录验证信息
          await tx.insert(depositVerifications).values({
            depositId: input.depositId,
            verificationMethod: "manual",
            verificationResult: false,
            verificationDetails: JSON.stringify({
              verifiedBy: ctx.user.id,
              reason: input.reason,
              timestamp: new Date().toISOString(),
            }),
            verifiedBy: ctx.user.id,
          });

          // 3. 记录操作日志
          logger.info("Deposit rejected", {
            depositId: input.depositId,
            userId: deposit.userId,
            amount: deposit.amount,
            rejectedBy: ctx.user.id,
            reason: input.reason,
          });
        });

        return {
          success: true,
          message: "Deposit rejected successfully",
          data: {
            depositId: input.depositId,
            status: "rejected",
            rejectedAt: new Date().toISOString(),
          },
        };
      } catch (error) {
        logger.error("Failed to reject deposit", error, {
          depositId: input.depositId,
          operatedBy: ctx.user.id,
        });
        throw error;
      }
    }),

  /**
   * 获取入金列表 - 增强版
   */
  getDepositList: protectedProcedure
    .input(
      z.object({
        status: z.enum(["all", "pending", "confirmed", "rejected"]).optional(),
        page: z.number().default(1),
        pageSize: z.number().default(10),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const offset = (input.page - 1) * input.pageSize;

      // 构建查询条件
      let conditions: any[] = [];
      
      if (input.status && input.status !== "all") {
        conditions.push(eq(deposits.status, input.status));
      }

      if (input.startDate) {
        conditions.push(gte(deposits.createdAt, new Date(input.startDate)));
      }

      if (input.endDate) {
        conditions.push(lte(deposits.createdAt, new Date(input.endDate)));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // 获取入金记录
      const depositsResult = await db
        .select()
        .from(deposits)
        .where(whereClause)
        .limit(input.pageSize)
        .offset(offset);

      // 获取总数
      const totalResult = await db
        .select()
        .from(deposits)
        .where(whereClause);

      // 获取用户信息（简化版，实际应该使用 JOIN）
      const enrichedDeposits = await Promise.all(
        depositsResult.map(async (deposit) => {
          const userResult = await db
            .select()
            .from(users)
            .where(eq(users.id, deposit.userId))
            .limit(1);
          
          return {
            ...deposit,
            user: userResult[0] || null,
          };
        })
      );

      return {
        list: enrichedDeposits,
        total: totalResult.length,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  /**
   * 获取操作审计日志
   */
  getAuditLogs: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      // 这里应该查询实际的审计日志表
      // 暂时返回模拟数据
      return {
        list: [],
        total: 0,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),
});