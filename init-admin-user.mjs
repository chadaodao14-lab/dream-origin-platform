/**
 * Initialize Admin User Script
 * Creates the top-level admin account (User ID: 1) with initial assets
 * 
 * Usage: node scripts/init-admin-user.mjs
 */

import { db } from '../db.js';
import { users, assets } from '../schema.js';
import { eq } from "drizzle-orm";

const ADMIN_USER_ID = 1;
const ADMIN_OPEN_ID = "admin-001";
const ADMIN_INVITE_CODE = "ADMIN001";
const INITIAL_BALANCE = "1000000.00"; // 100万初始资金

async function initAdminUser() {
  try {
    console.log("🚀 Starting admin user initialization...\n");

    // 1. Check if admin user already exists
    console.log("📋 Checking for existing admin user...");
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.id, ADMIN_USER_ID));

    if (existingAdmin.length > 0) {
      console.log("⚠️  Admin user already exists!");
      console.log("Admin User Details:");
      console.log(`  ID: ${existingAdmin[0].id}`);
      console.log(`  Name: ${existingAdmin[0].name}`);
      console.log(`  Role: ${existingAdmin[0].role}`);
      console.log(`  Activated: ${existingAdmin[0].isActivated}`);
      return;
    }

    // 2. Create admin user
    console.log("\n👤 Creating admin user...");
    const adminUser = await db.insert(users).values({
      openId: ADMIN_OPEN_ID,
      name: "Administrator",
      email: "admin@dreamsource.com",
      loginMethod: "admin",
      role: "admin",
      inviteCode: ADMIN_INVITE_CODE,
      invitePath: "1",
      directCount: 0,
      isActivated: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    console.log("✅ Admin user created successfully");

    // 3. Create initial assets
    console.log("\n💰 Creating initial assets...");
    const adminAssets = await db.insert(assets).values({
      userId: ADMIN_USER_ID,
      availableBalance: INITIAL_BALANCE,
      frozenBalance: "0.00",
      totalCommission: "0.00",
      monthlyIncome: "0.00",
      monthlyExpense: "0.00",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("✅ Initial assets created successfully");

    // 4. Verify creation
    console.log("\n🔍 Verifying admin user...");
    const verifyUser = await db
      .select()
      .from(users)
      .where(eq(users.id, ADMIN_USER_ID));

    const verifyAssets = await db
      .select()
      .from(assets)
      .where(eq(assets.userId, ADMIN_USER_ID));

    if (verifyUser.length > 0 && verifyAssets.length > 0) {
      console.log("✅ Admin user verified successfully!\n");
      console.log("📊 Admin User Details:");
      console.log(`  ID: ${verifyUser[0].id}`);
      console.log(`  Name: ${verifyUser[0].name}`);
      console.log(`  Email: ${verifyUser[0].email}`);
      console.log(`  Role: ${verifyUser[0].role}`);
      console.log(`  OpenID: ${verifyUser[0].openId}`);
      console.log(`  Invite Code: ${verifyUser[0].inviteCode}`);
      console.log(`  Activated: ${verifyUser[0].isActivated}`);
      console.log(`\n💵 Asset Details:`);
      console.log(`  Available Balance: $${verifyAssets[0].availableBalance}`);
      console.log(`  Frozen Balance: $${verifyAssets[0].frozenBalance}`);
      console.log(`  Total Commission: $${verifyAssets[0].totalCommission}`);
      console.log(`\n✨ Admin user initialization completed successfully!`);
    } else {
      console.error("❌ Verification failed!");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error initializing admin user:");
    console.error(error);
    process.exit(1);
  }
}

// Run the initialization
initAdminUser().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
