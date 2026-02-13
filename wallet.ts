import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { userWallets } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const walletRouter = router({
  // Get user's wallet
  getWallet: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const wallet = await db
      .select()
      .from(userWallets)
      .where(eq(userWallets.userId, ctx.user!.id))
      .limit(1);

    return wallet[0] || null;
  }),

  // Bind wallet address
  bindWallet: protectedProcedure
    .input(
      z.object({
        walletAddress: z.string().min(26).max(100),
        walletType: z.enum(["trc20", "eth", "btc"]).default("trc20"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if wallet already exists
      const existingWallet = await db
        .select()
        .from(userWallets)
        .where(eq(userWallets.userId, ctx.user!.id))
        .limit(1);

      if (existingWallet.length > 0) {
        // Update existing wallet
        await db
          .update(userWallets)
          .set({
            walletAddress: input.walletAddress,
            walletType: input.walletType,
            isVerified: false,
            verificationCode: null,
            verifiedAt: null,
          })
          .where(eq(userWallets.userId, ctx.user!.id));
      } else {
        // Create new wallet
        await db.insert(userWallets).values({
          userId: ctx.user!.id,
          walletAddress: input.walletAddress,
          walletType: input.walletType,
          isVerified: false,
        });
      }

      return { success: true, message: "Wallet bound successfully" };
    }),

  // Verify wallet (admin can verify)
  verifyWallet: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user is admin
      if (ctx.user?.role !== "admin") {
        throw new Error("Only admins can verify wallets");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(userWallets)
        .set({
          isVerified: true,
          verifiedAt: new Date(),
        })
        .where(eq(userWallets.userId, input.userId));

      return { success: true, message: "Wallet verified" };
    }),

  // Update wallet address
  updateWallet: protectedProcedure
    .input(
      z.object({
        walletAddress: z.string().min(26).max(100),
        walletType: z.enum(["trc20", "eth", "btc"]).default("trc20"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const wallet = await db
        .select()
        .from(userWallets)
        .where(eq(userWallets.userId, ctx.user!.id))
        .limit(1);

      if (!wallet.length) {
        throw new Error("Wallet not found");
      }

      await db
        .update(userWallets)
        .set({
          walletAddress: input.walletAddress,
          walletType: input.walletType,
          isVerified: false,
          verificationCode: null,
          verifiedAt: null,
        })
        .where(eq(userWallets.userId, ctx.user!.id));

      return { success: true, message: "Wallet updated successfully" };
    }),

  // Delete wallet
  deleteWallet: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .delete(userWallets)
      .where(eq(userWallets.userId, ctx.user!.id));

    return { success: true, message: "Wallet deleted" };
  }),
});
