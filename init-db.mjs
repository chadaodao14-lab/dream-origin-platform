/**
 * Initialize Admin User Script
 * Creates the top-level admin account (User ID: 1) with initial assets
 * 
 * Usage: node init-db.mjs
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { users, assets } from "./schema.ts";
import { eq } from "drizzle-orm";

const ADMIN_USER_ID = 1;
const INITIAL_ASSETS = 1000000; // 1,000,000 初始资产

async function initializeAdminUser() {
  console.log("🚀 Initializing admin user...");
  
  try {
    // 获取数据库连接
    const databaseUrl = process.env.DATABASE_URL || "mysql://root:@localhost:3306/dreamsource_db";
    
    // 解析数据库URL
    const url = new URL(databaseUrl);
    const connectionConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1),
    };

    // 创建数据库连接
    const connection = await mysql.createConnection(connectionConfig);
    const db = drizzle(connection);

    // 检查用户是否已存在
    const existingUser = await db.select().from(users).where(eq(users.id, ADMIN_USER_ID));
    
    if (existingUser.length > 0) {
      console.log("✅ Admin user already exists");
      
      // 检查资产记录
      const existingAssets = await db.select().from(assets).where(eq(assets.userId, ADMIN_USER_ID));
      if (existingAssets.length === 0) {
        console.log("💰 Creating initial assets for admin user...");
        await db.insert(assets).values({
          userId: ADMIN_USER_ID,
          totalAmount: INITIAL_ASSETS,
          frozenAmount: 0,
          availableAmount: INITIAL_ASSETS,
        });
        console.log("✅ Initial assets created");
      } else {
        console.log("✅ Admin user assets already exist");
      }
    } else {
      console.log("👤 Creating admin user...");
      
      // 创建管理员用户
      await db.insert(users).values({
        id: ADMIN_USER_ID,
        username: "admin",
        email: "admin@dreamsource.com",
        phone: "13800138000",
        realName: "系统管理员",
        idCard: "110101199001011234",
        status: "active",
        level: 0,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log("💰 Creating initial assets...");
      
      // 创建初始资产
      await db.insert(assets).values({
        userId: ADMIN_USER_ID,
        totalAmount: INITIAL_ASSETS,
        frozenAmount: 0,
        availableAmount: INITIAL_ASSETS,
      });

      console.log("✅ Admin user and assets created successfully");
    }

    // 验证创建结果
    const userResult = await db.select().from(users).where(eq(users.id, ADMIN_USER_ID));
    const assetsResult = await db.select().from(assets).where(eq(assets.userId, ADMIN_USER_ID));
    
    console.log("\n📋 Verification:");
    console.log(`User: ${userResult[0]?.username || 'Not found'}`);
    console.log(`Assets: ${assetsResult[0]?.totalAmount || 0}`);
    
    await connection.end();
    
  } catch (error) {
    console.error("❌ Initialization failed:", error.message);
    process.exit(1);
  }
}

// 执行初始化
initializeAdminUser();