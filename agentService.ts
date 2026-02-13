import { getDb } from "../db";
import { users, commissions, deposits } from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";

const MAX_DIRECT_REFERRALS = 5;
const MAX_LEVELS = 9;

/**
 * Register a new user with invite code
 */
export async function registerUserWithInvite(
  userId: number,
  userName: string,
  inviterCode?: string
): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user.length) {
    return { success: false, message: "User not found" };
  }

  // If no inviter code provided, user is a root referrer
  if (!inviterCode) {
    return { success: true, message: "User registered as root referrer" };
  }

  // Find inviter by code
  const inviterResult = await db.select().from(users).where(eq(users.inviteCode, inviterCode)).limit(1);
  if (!inviterResult.length) {
    return { success: false, message: "Invalid invite code" };
  }

  const inviter = inviterResult[0];

  // Check if inviter has reached max direct referrals
  const directCount = inviter.directCount ?? 0;
  if (directCount >= MAX_DIRECT_REFERRALS) {
    return { success: false, message: "Inviter has reached maximum direct referrals (5)" };
  }

  // Build invite path
  const inviterPath = inviter.invitePath ? `${inviter.invitePath}${inviter.id}/` : `${inviter.id}/`;
  const pathLevels = inviterPath.split("/").filter(Boolean).length;

  if (pathLevels >= MAX_LEVELS) {
    return { success: false, message: "Maximum referral depth (9 levels) reached" };
  }

  // Update user with inviter info
  await db
    .update(users)
    .set({
      inviterId: inviter.id,
      invitePath: inviterPath + userId + "/",
    })
    .where(eq(users.id, userId));

  // Increment inviter's direct count
  await db
    .update(users)
    .set({
      directCount: directCount + 1,
    })
    .where(eq(users.id, inviter.id));

  return { success: true, message: "User registered successfully" };
}

/**
 * Get agent summary for a user
 */
export async function getAgentSummary(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user.length) {
    throw new Error("User not found");
  }

  const userData = user[0];

  // Get direct referrals
  const directReferrals = await db
    .select()
    .from(users)
    .where(eq(users.inviterId, userId));

  // Get team size (all descendants)
  const invitePath = userData.invitePath;
  let teamTotal = 0;
  if (invitePath) {
    const descendants = await db
      .select()
      .from(users)
      .where(sql`invite_path LIKE ${`%${userId}/%`}`);
    teamTotal = descendants.length;
  }

  // Get team performance (total deposits from team)
  let teamPerformance = 0;
  if (invitePath) {
    const teamMembers = await db
      .select()
      .from(users)
      .where(sql`invite_path LIKE ${`%${userId}/%`}`);

    const teamIds = teamMembers.map((m) => m.id);
    if (teamIds.length > 0) {
      const teamDeposits = await db
        .select()
        .from(deposits)
        .where(sql`user_id IN (${teamIds.join(",")})`);

      teamPerformance = teamDeposits.reduce((sum, d) => sum + parseFloat((d.amount ?? "0").toString()), 0);
    }
  }

  // Get inviter info
  let inviterInfo = null;
  if (userData.inviterId) {
    const inviter = await db.select().from(users).where(eq(users.id, userData.inviterId)).limit(1);
    if (inviter.length) {
      inviterInfo = {
        id: inviter[0].id,
        name: inviter[0].name,
      };
    }
  }

  return {
    directCount: `${directReferrals.length}/${MAX_DIRECT_REFERRALS}`,
    teamTotal,
    teamPerformance,
    inviteCode: userData.inviteCode,
    inviterInfo,
  };
}

/**
 * Get team members for a user
 */
export async function getTeamMembers(userId: number, page: number = 1, pageSize: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const offset = (page - 1) * pageSize;

  // Get direct referrals
  const members = await db
    .select()
    .from(users)
    .where(eq(users.inviterId, userId))
    .limit(pageSize)
    .offset(offset);

  const totalResult = await db.select().from(users).where(eq(users.inviterId, userId));

  return {
    list: members,
    total: totalResult.length,
    page,
    pageSize,
  };
}

/**
 * Get team performance details
 */
export async function getTeamPerformance(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user.length) {
    throw new Error("User not found");
  }

  const userData = user[0];
  const invitePath = userData.invitePath;

  if (!invitePath) {
    return {
      level1Performance: 0,
      level2Performance: 0,
      level3Performance: 0,
      totalPerformance: 0,
    };
  }

  // Get all descendants
  const descendants = await db
    .select()
    .from(users)
    .where(sql`invite_path LIKE ${`%${userId}/%`}`);

  const descendantIds = descendants.map((d) => d.id);

  // Calculate performance by level
  let level1Performance = 0;
  let level2Performance = 0;
  let level3Performance = 0;

  for (const descendant of descendants) {
    const descendantPath = descendant.invitePath || "";
    const levels = descendantPath.split("/").filter(Boolean);
    const userIndex = levels.indexOf(userId.toString());

    if (userIndex >= 0) {
      const level = levels.length - userIndex;

      const userDeposits = await db.select().from(deposits).where(eq(deposits.userId, descendant.id));
      const userTotal = userDeposits.reduce((sum, d) => sum + parseFloat((d.amount ?? "0").toString()), 0);

      if (level === 1) {
        level1Performance += userTotal;
      } else if (level === 2) {
        level2Performance += userTotal;
      } else if (level === 3) {
        level3Performance += userTotal;
      }
    }
  }

  return {
    level1Performance,
    level2Performance,
    level3Performance,
    totalPerformance: level1Performance + level2Performance + level3Performance,
  };
}
