import { getDb, getOrCreateAsset } from "../db";
import { deposits, assets } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { generateCommissions } from "./commissionService";

const DEPOSIT_AMOUNT = 300;

/**
 * Submit a deposit request
 */
export async function submitDeposit(
  userId: number,
  txHash: string,
  proofFile?: string,
  remark?: string
): Promise<{ id: number; status: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if deposit with same tx hash already exists
  const existing = await db.select().from(deposits).where(eq(deposits.txHash, txHash)).limit(1);
  if (existing.length) {
    throw new Error("Deposit with this transaction hash already exists");
  }

  // Create deposit record
  const result = await db.insert(deposits).values({
    userId,
    amount: DEPOSIT_AMOUNT.toString(),
    txHash,
    status: "pending" as const,
    proofFile,
    remark,
  });

  return {
    id: result[0].insertId || 0,
    status: "pending",
  };
}

/**
 * Confirm a deposit (admin only)
 */
export async function confirmDeposit(depositId: number, remark?: string): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const deposit = await db.select().from(deposits).where(eq(deposits.id, depositId)).limit(1);
  if (!deposit.length) {
    throw new Error("Deposit not found");
  }

  const depositRecord = deposit[0];
  if (depositRecord.status !== "pending") {
    throw new Error("Deposit is not in pending status");
  }

  // Update deposit status
  await db
    .update(deposits)
    .set({
      status: "confirmed" as const,
      confirmedAt: new Date(),
      remark: remark || depositRecord.remark,
    })
    .where(eq(deposits.id, depositId));

  // Activate user
  const user = await db.select().from(deposits).where(eq(deposits.id, depositId)).limit(1);
  if (user.length) {
    // Update user activation status
    const userId = user[0].userId;
    // This would require importing users table - handled in main routers
  }

  // Generate commissions
  try {
    await generateCommissions(depositId);
  } catch (error) {
    console.error("Error generating commissions:", error);
    throw error;
  }

  return { success: true, message: "Deposit confirmed and commissions generated" };
}

/**
 * Reject a deposit (admin only)
 */
export async function rejectDeposit(depositId: number, remark?: string): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const deposit = await db.select().from(deposits).where(eq(deposits.id, depositId)).limit(1);
  if (!deposit.length) {
    throw new Error("Deposit not found");
  }

  const depositRecord = deposit[0];
  if (depositRecord.status !== "pending") {
    throw new Error("Deposit is not in pending status");
  }

  // Update deposit status
  await db
    .update(deposits)
    .set({
      status: "rejected" as const,
      remark: remark || depositRecord.remark,
    })
    .where(eq(deposits.id, depositId));

  return { success: true, message: "Deposit rejected" };
}

/**
 * Get deposit list (admin)
 */
export async function getDepositList(
  status?: string,
  page: number = 1,
  pageSize: number = 10
): Promise<{ list: any[]; total: number; page: number; pageSize: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const offset = (page - 1) * pageSize;

  let records: any[] = [];
  let totalResult: any[] = [];

  if (status) {
    records = await db
      .select()
      .from(deposits)
      .where(eq(deposits.status, status as any))
      .limit(pageSize)
      .offset(offset);
    totalResult = await db.select().from(deposits).where(eq(deposits.status, status as any));
  } else {
    records = await db.select().from(deposits).limit(pageSize).offset(offset);
    totalResult = await db.select().from(deposits);
  }

  return {
    list: records,
    total: totalResult.length,
    page,
    pageSize,
  };
}

/**
 * Get user's deposit history
 */
export async function getUserDeposits(userId: number, page: number = 1, pageSize: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const offset = (page - 1) * pageSize;

  const records = await db
    .select()
    .from(deposits)
    .where(eq(deposits.userId, userId))
    .limit(pageSize)
    .offset(offset);

  const totalResult = await db.select().from(deposits).where(eq(deposits.userId, userId));

  return {
    list: records,
    total: totalResult.length,
    page,
    pageSize,
  };
}
