import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb, getUserById, getUserByInviteCode, getOrCreateAsset } from "./db";
import { users, assets, deposits, commissions, fundFlows } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import * as commissionService from "./services/commissionService";
import * as depositService from "./services/depositService";
import * as agentService from "./services/agentService";
import * as assetService from "./services/assetService";
import { adminRouter } from "./routers/admin";
import { adminRolesRouter } from "./routers/adminRoles";

export const appRouter = router({
  system: systemRouter,

  adminRoles: adminRolesRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // User management
  user: router({
    register: publicProcedure
      .input(
        z.object({
          inviteCode: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new Error("User not authenticated");
        }

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Check if user already has invite code
        const existingUser = await getUserById(ctx.user.id);
        if (existingUser?.inviteCode) {
          return { success: true, message: "User already registered" };
        }

        // Register with invite code
        if (input.inviteCode) {
          const result = await agentService.registerUserWithInvite(ctx.user.id, ctx.user.name || "", input.inviteCode);
          if (!result.success) {
            throw new Error(result.message);
          }
        }

        // Create asset record
        await getOrCreateAsset(ctx.user.id);

        return { success: true, message: "User registered successfully" };
      }),

    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) throw new Error("User not found");

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        inviteCode: user.inviteCode,
        isActivated: user.isActivated,
        trc20WalletAddress: user.trc20WalletAddress,
        directCount: user.directCount,
      };
    }),

    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
          trc20WalletAddress: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db
          .update(users)
          .set({
            name: input.name,
            trc20WalletAddress: input.trc20WalletAddress,
          })
          .where(eq(users.id, ctx.user.id));

        return { success: true, message: "Profile updated" };
      }),
  }),

  // Asset management
  asset: router({
    getAsset: protectedProcedure.query(async ({ ctx }) => {
      return await assetService.getUserAsset(ctx.user.id);
    }),

    submitWithdrawal: protectedProcedure
      .input(
        z.object({
          amount: z.number().positive(),
          walletAddress: z.string().min(1),
          remark: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await assetService.submitWithdrawal(
          ctx.user.id,
          input.amount,
          input.walletAddress,
          input.remark
        );
      }),

    getWithdrawalHistory: protectedProcedure
      .input(
        z.object({
          page: z.number().default(1),
          pageSize: z.number().default(10),
        })
      )
      .query(async ({ input, ctx }) => {
        return await assetService.getWithdrawalHistory(ctx.user.id, input.page, input.pageSize);
      }),

    transfer: protectedProcedure
      .input(
        z.object({
          toUserId: z.number(),
          amount: z.number().positive(),
          remark: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await assetService.transferFunds(ctx.user.id, input.toUserId, input.amount, input.remark);
      }),
  }),

  // Deposit management
  deposit: router({
    submit: protectedProcedure
      .input(
        z.object({
          txHash: z.string().min(1),
          proofFile: z.string().optional(),
          remark: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await depositService.submitDeposit(ctx.user.id, input.txHash, input.proofFile, input.remark);
      }),

    getHistory: protectedProcedure
      .input(
        z.object({
          page: z.number().default(1),
          pageSize: z.number().default(10),
        })
      )
      .query(async ({ input, ctx }) => {
        return await depositService.getUserDeposits(ctx.user.id, input.page, input.pageSize);
      }),

    // Admin endpoints
    list: protectedProcedure
      .input(
        z.object({
          status: z.string().optional(),
          page: z.number().default(1),
          pageSize: z.number().default(10),
        })
      )
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return await depositService.getDepositList(input.status, input.page, input.pageSize);
      }),

    confirm: protectedProcedure
      .input(
        z.object({
          depositId: z.number(),
          remark: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return await depositService.confirmDeposit(input.depositId, input.remark);
      }),

    reject: protectedProcedure
      .input(
        z.object({
          depositId: z.number(),
          remark: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return await depositService.rejectDeposit(input.depositId, input.remark);
      }),
  }),

  // Commission management
  commission: router({
    getList: protectedProcedure
      .input(
        z.object({
          page: z.number().default(1),
          pageSize: z.number().default(10),
        })
      )
      .query(async ({ input, ctx }) => {
        return await commissionService.getUserCommissions(ctx.user.id, input.page, input.pageSize);
      }),
  }),

  // Agent/Referral system
  agent: router({
    getSummary: protectedProcedure.query(async ({ ctx }) => {
      return await agentService.getAgentSummary(ctx.user.id);
    }),

    getTeamMembers: protectedProcedure
      .input(
        z.object({
          page: z.number().default(1),
          pageSize: z.number().default(10),
        })
      )
      .query(async ({ input, ctx }) => {
        return await agentService.getTeamMembers(ctx.user.id, input.page, input.pageSize);
      }),

    getTeamPerformance: protectedProcedure.query(async ({ ctx }) => {
      return await agentService.getTeamPerformance(ctx.user.id);
    }),
  }),

  // Fund flow tracking
  fundFlow: router({
    getList: protectedProcedure
      .input(
        z.object({
          type: z.string().optional(),
          page: z.number().default(1),
          pageSize: z.number().default(10),
        })
      )
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const offset = (input.page - 1) * input.pageSize;

        let records: any[] = [];
        let totalResult: any[] = [];

        if (input.type) {
          records = await db
            .select()
            .from(fundFlows)
            .where(eq(fundFlows.type, input.type as any))
            .limit(input.pageSize)
            .offset(offset);
          totalResult = await db.select().from(fundFlows).where(eq(fundFlows.type, input.type as any));
        } else {
          records = await db.select().from(fundFlows).limit(input.pageSize).offset(offset);
          totalResult = await db.select().from(fundFlows);
        }

        return {
          list: records,
          total: totalResult.length,
          page: input.page,
          pageSize: input.pageSize,
        };
      }),
  }),

  // Admin dashboard
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
