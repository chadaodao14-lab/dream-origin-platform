import { getDb, getOrCreateAsset } from "../db";
import { assets, withdrawals, transfers } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Get user asset information
 */
export async function getUserAsset(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const asset = await getOrCreateAsset(userId);
  if (!asset) {
    throw new Error("Failed to get or create asset");
  }

  return {
    availableBalance: asset.availableBalance ? parseFloat((asset.availableBalance as any).toString()) : 0,
    frozenBalance: asset.frozenBalance ? parseFloat((asset.frozenBalance as any).toString()) : 0,
    totalCommission: asset.totalCommission ? parseFloat((asset.totalCommission as any).toString()) : 0,
    monthlyIncome: asset.monthlyIncome ? parseFloat((asset.monthlyIncome as any).toString()) : 0,
    monthlyExpense: asset.monthlyExpense ? parseFloat((asset.monthlyExpense as any).toString()) : 0,
    lastDepositAt: asset.lastDepositAt,
  };
}

/**
 * Submit a withdrawal request
 */
export async function submitWithdrawal(
  userId: number,
  amount: number,
  walletAddress: string,
  remark?: string
): Promise<{ id: number; status: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check user's available balance
  const asset = await getOrCreateAsset(userId);
  if (!asset) {
    throw new Error("Asset not found");
  }

  const availableBalance = asset.availableBalance ? parseFloat((asset.availableBalance as any).toString()) : 0;
  if (availableBalance < amount) {
    throw new Error("Insufficient balance");
  }

  // Create withdrawal record
  const result = await db.insert(withdrawals).values({
    userId,
    amount: amount.toString(),
    walletAddress,
    status: "pending" as const,
    remark,
  });

  // Freeze the amount
  const frozenBalance = asset.frozenBalance ? parseFloat((asset.frozenBalance as any).toString()) : 0;
  await db
    .update(assets)
    .set({
      availableBalance: (availableBalance - amount).toString(),
      frozenBalance: (frozenBalance + amount).toString(),
    })
    .where(eq(assets.userId, userId));

  return {
    id: result[0].insertId || 0,
    status: "pending",
  };
}

/**
 * Process a withdrawal (admin)
 */
export async function processWithdrawal(
  withdrawalId: number,
  txHash: string,
  remark?: string
): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const withdrawal = await db.select().from(withdrawals).where(eq(withdrawals.id, withdrawalId)).limit(1);
  if (!withdrawal.length) {
    throw new Error("Withdrawal not found");
  }

  const withdrawalRecord = withdrawal[0];
  if (withdrawalRecord.status !== "pending") {
    throw new Error("Withdrawal is not in pending status");
  }

  // Update withdrawal status
  await db
    .update(withdrawals)
    .set({
      status: "completed" as const,
      txHash,
      processedAt: new Date(),
      remark: remark || withdrawalRecord.remark,
    })
    .where(eq(withdrawals.id, withdrawalId));

  // Update user's frozen balance
  const asset = await getOrCreateAsset(withdrawalRecord.userId);
  if (asset) {
    const frozenBalance = asset.frozenBalance ? parseFloat((asset.frozenBalance as any).toString()) : 0;
    const amount = withdrawalRecord.amount ? parseFloat((withdrawalRecord.amount as any).toString()) : 0;

    await db
      .update(assets)
      .set({
        frozenBalance: Math.max(0, frozenBalance - amount).toString(),
        monthlyExpense: asset.monthlyExpense
          ? (parseFloat((asset.monthlyExpense as any).toString()) + amount).toString()
          : amount.toString(),
      })
      .where(eq(assets.userId, withdrawalRecord.userId));
  }

  return { success: true, message: "Withdrawal processed" };
}

/**
 * Reject a withdrawal (admin)
 */
export async function rejectWithdrawal(
  withdrawalId: number,
  remark?: string
): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const withdrawal = await db.select().from(withdrawals).where(eq(withdrawals.id, withdrawalId)).limit(1);
  if (!withdrawal.length) {
    throw new Error("Withdrawal not found");
  }

  const withdrawalRecord = withdrawal[0];
  if (withdrawalRecord.status !== "pending") {
    throw new Error("Withdrawal is not in pending status");
  }

  // Update withdrawal status
  await db
    .update(withdrawals)
    .set({
      status: "rejected" as const,
      remark: remark || withdrawalRecord.remark,
    })
    .where(eq(withdrawals.id, withdrawalId));

  // Unfreeze the amount
  const asset = await getOrCreateAsset(withdrawalRecord.userId);
  if (asset) {
    const frozenBalance = asset.frozenBalance ? parseFloat((asset.frozenBalance as any).toString()) : 0;
    const availableBalance = asset.availableBalance ? parseFloat((asset.availableBalance as any).toString()) : 0;
    const amount = withdrawalRecord.amount ? parseFloat((withdrawalRecord.amount as any).toString()) : 0;

    await db
      .update(assets)
      .set({
        frozenBalance: Math.max(0, frozenBalance - amount).toString(),
        availableBalance: (availableBalance + amount).toString(),
      })
      .where(eq(assets.userId, withdrawalRecord.userId));
  }

  return { success: true, message: "Withdrawal rejected" };
}

/**
 * Transfer funds between users
 */
export async function transferFunds(
  fromUserId: number,
  toUserId: number,
  amount: number,
  remark?: string
): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check sender's balance
  const fromAsset = await getOrCreateAsset(fromUserId);
  if (!fromAsset) {
    throw new Error("Sender asset not found");
  }

  const fromBalance = fromAsset.availableBalance ? parseFloat((fromAsset.availableBalance as any).toString()) : 0;
  if (fromBalance < amount) {
    throw new Error("Insufficient balance");
  }

  // Create transfer record
  await db.insert(transfers).values({
    fromUserId,
    toUserId,
    amount: amount.toString(),
    remark,
  });

  // Update sender's balance
  await db
    .update(assets)
    .set({
      availableBalance: (fromBalance - amount).toString(),
      monthlyExpense: fromAsset.monthlyExpense
        ? (parseFloat((fromAsset.monthlyExpense as any).toString()) + amount).toString()
        : amount.toString(),
    })
    .where(eq(assets.userId, fromUserId));

  // Update receiver's balance
  const toAsset = await getOrCreateAsset(toUserId);
  if (toAsset) {
    const toBalance = toAsset.availableBalance ? parseFloat((toAsset.availableBalance as any).toString()) : 0;
    await db
      .update(assets)
      .set({
        availableBalance: (toBalance + amount).toString(),
        monthlyIncome: toAsset.monthlyIncome
          ? (parseFloat((toAsset.monthlyIncome as any).toString()) + amount).toString()
          : amount.toString(),
      })
      .where(eq(assets.userId, toUserId));
  }

  return { success: true, message: "Transfer completed" };
}

/**
 * Get withdrawal history
 */
export async function getWithdrawalHistory(userId: number, page: number = 1, pageSize: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const offset = (page - 1) * pageSize;

  const records = await db
    .select()
    .from(withdrawals)
    .where(eq(withdrawals.userId, userId))
    .limit(pageSize)
    .offset(offset);

  const totalResult = await db.select().from(withdrawals).where(eq(withdrawals.userId, userId));

  return {
    list: records,
    total: totalResult.length,
    page,
    pageSize,
  };
}
