import { getDb } from "../db";
import { commissions, deposits, assets, fundFlows, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Commission rates for 7-level referral system
 * Total: 57% of deposit amount (300 USD)
 */
const COMMISSION_RATES = [
  0.20, // Level 1: 20% = 60 USD (Direct upline)
  0.08, // Level 2: 8% = 24 USD (Indirect upline)
  0.08, // Level 3: 8% = 24 USD (3rd level upline)
  0.06, // Level 4: 6% = 18 USD (4th level upline)
  0.05, // Level 5: 5% = 15 USD (5th level upline)
  0.05, // Level 6: 5% = 15 USD (6th level upline)
  0.05, // Level 7: 5% = 15 USD (7th level upline)
];

const DEPOSIT_AMOUNT = 300;
const CHARITY_PERCENTAGE = 0.03; // 3% to charity
const STARTUP_POOL_PERCENTAGE = 0.37; // 37% to startup pool

/**
 * Get upline chain for a user (up to 9 levels)
 */
export async function getUplineChain(userId: number): Promise<Array<{ user: any; level: number }>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user.length) return [];

  const invitePath = user[0].invitePath;
  if (!invitePath) return [];

  const pathIds = invitePath.split("/").filter(Boolean).map(Number);
  const chain: Array<{ user: any; level: number }> = [];

  for (let i = 0; i < pathIds.length && i < 7; i++) {
    const ancestorId = pathIds[pathIds.length - 1 - i];
    const ancestor = await db.select().from(users).where(eq(users.id, ancestorId)).limit(1);
    if (ancestor.length) {
      chain.push({
        user: ancestor[0],
        level: i + 1,
      });
    }
  }

  return chain;
}

/**
 * Generate commissions after deposit confirmation
 */
export async function generateCommissions(depositId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const deposit = await db.select().from(deposits).where(eq(deposits.id, depositId)).limit(1);
  if (!deposit.length || deposit[0].status !== "confirmed") {
    throw new Error("Invalid or unconfirmed deposit");
  }

  const depositRecord = deposit[0];
  const sourceUserId = depositRecord.userId;
  const depositAmount = parseFloat((depositRecord.amount as any) ?? "300");
  if (!depositAmount || depositAmount <= 0) {
    throw new Error("Invalid deposit amount");
  }

  // Get upline chain
  const uplineChain = await getUplineChain(sourceUserId);

  // Get or create platform account (user with ID 1, or the owner)
  const platformAccounts = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
  const platformAccount = platformAccounts.length ? platformAccounts[0] : null;

  // Generate commissions for each level
  for (let level = 1; level <= 9; level++) {
    const rate = COMMISSION_RATES[level - 1];
    const commissionAmount = Math.round(depositAmount * rate * 100) / 100;

    let targetUserId = sourceUserId;
    let targetUser = null;

    // Find the target user at this level
    const uplineAtLevel = uplineChain.find((item) => item.level === level);
    if (uplineAtLevel) {
      targetUser = uplineAtLevel.user;
      targetUserId = targetUser.id;
    } else if (platformAccount) {
      // If no upline at this level, assign to platform account
      targetUserId = platformAccount.id;
      targetUser = platformAccount;
    } else {
      // Skip if no platform account
      continue;
    }

    // Create commission record
    await db.insert(commissions).values({
      sourceUserId,
      targetUserId,
      level,
      amount: commissionAmount.toString(),
      status: "confirmed" as const,
    });

    // Update target user's asset
    const userAssets = await db.select().from(assets).where(eq(assets.userId, targetUserId)).limit(1);
    if (userAssets.length) {
      const currentBalance = userAssets[0].availableBalance ? parseFloat(userAssets[0].availableBalance.toString()) : 0;
      const currentCommission = userAssets[0].totalCommission ? parseFloat(userAssets[0].totalCommission.toString()) : 0;
      const currentIncome = userAssets[0].monthlyIncome ? parseFloat(userAssets[0].monthlyIncome.toString()) : 0;

      await db
        .update(assets)
        .set({
          availableBalance: (currentBalance + commissionAmount).toString(),
          totalCommission: (currentCommission + commissionAmount).toString(),
          monthlyIncome: (currentIncome + commissionAmount).toString(),
        })
        .where(eq(assets.userId, targetUserId));
    } else {
      // Create asset if not exists
      await db.insert(assets).values({
        userId: targetUserId,
        availableBalance: commissionAmount.toString(),
        totalCommission: commissionAmount.toString(),
        monthlyIncome: commissionAmount.toString(),
      });
    }
  }

  // Record fund flows
  const totalCommissionAmount = COMMISSION_RATES.reduce((sum, rate) => sum + depositAmount * rate, 0);
  const charityAmount = Math.round(depositAmount * CHARITY_PERCENTAGE * 100) / 100;
  const startupPoolAmount = Math.round(depositAmount * STARTUP_POOL_PERCENTAGE * 100) / 100;

  // Commission pool flow
  await db.insert(fundFlows).values({
    type: "commission" as const,
    direction: "income" as const,
    amount: totalCommissionAmount.toString(),
    source: "deposit_split" as const,
    relatedId: depositId,
    remark: `Commission distribution from deposit ${depositId}`,
  });

  // Charity fund flow
  await db.insert(fundFlows).values({
    type: "charity" as const,
    direction: "income" as const,
    amount: charityAmount.toString(),
    source: "deposit_split" as const,
    relatedId: depositId,
    remark: `Charity fund from deposit ${depositId}`,
  });

  // Startup pool flow
  await db.insert(fundFlows).values({
    type: "startup" as const,
    direction: "income" as const,
    amount: startupPoolAmount.toString(),
    source: "deposit_split" as const,
    relatedId: depositId,
    remark: `Startup pool from deposit ${depositId}`,
  });
}

/**
 * Get commission records for a user
 */
export async function getUserCommissions(userId: number, page: number = 1, pageSize: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const offset = (page - 1) * pageSize;

  const records = await db
    .select()
    .from(commissions)
    .where(eq(commissions.targetUserId, userId))
    .limit(pageSize)
    .offset(offset);

  const totalResult = await db
    .select()
    .from(commissions)
    .where(eq(commissions.targetUserId, userId));

  return {
    list: records,
    total: totalResult.length,
    page,
    pageSize,
  };
}
