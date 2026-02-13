/**
 * Database Migration Script
 * Creates all required tables for DreamSource platform
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { users, assets, deposits } from "./schema.ts";

async function migrateDatabase() {
  console.log("🚀 Starting database migration...");
  
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

    console.log("✅ Connected to database");

    // 创建表
    console.log("📋 Creating tables...");
    
    // 注意：在生产环境中应该使用专业的迁移工具
    // 这里使用简单的 SQL 方式创建表
    
    const createUserTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        openId VARCHAR(64) NOT NULL UNIQUE,
        name TEXT,
        email VARCHAR(320) UNIQUE,
        loginMethod VARCHAR(64),
        role ENUM('user', 'admin') DEFAULT 'user' NOT NULL,
        inviter_id INT,
        invite_code VARCHAR(20) NOT NULL UNIQUE,
        invite_path VARCHAR(500),
        direct_count TINYINT DEFAULT 0,
        trc20_wallet_address VARCHAR(100),
        is_activated BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        INDEX idx_inviter_id (inviter_id),
        INDEX idx_invite_code (invite_code),
        INDEX idx_is_activated (is_activated),
        UNIQUE KEY uq_openId (openId)
      )
    `;

    const createAssetsTableSQL = `
      CREATE TABLE IF NOT EXISTS assets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        total_amount DECIMAL(15,2) NOT NULL DEFAULT '0',
        frozen_amount DECIMAL(15,2) NOT NULL DEFAULT '0',
        available_amount DECIMAL(15,2) NOT NULL DEFAULT '0',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        INDEX idx_user_id (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `;

    const createDepositsTableSQL = `
      CREATE TABLE IF NOT EXISTS deposits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        status ENUM('pending', 'confirmed', 'rejected') DEFAULT 'pending' NOT NULL,
        transaction_hash VARCHAR(128),
        confirmed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        INDEX idx_deposit_user_id (user_id),
        INDEX idx_deposit_status (status),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `;

    // 执行创建表的SQL
    await connection.execute(createUserTableSQL);
    console.log("✅ Users table created");
    
    await connection.execute(createAssetsTableSQL);
    console.log("✅ Assets table created");
    
    await connection.execute(createDepositsTableSQL);
    console.log("✅ Deposits table created");

    console.log("🎉 Database migration completed successfully!");
    
    await connection.end();
    
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

// 执行迁移
migrateDatabase();