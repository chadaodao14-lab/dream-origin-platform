import { 
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  tinyint,
  boolean,
  json,
  unique,
  index,
  foreignKey,
} from "drizzle-orm/mysql-core";

/**
 * Core user table with multi-level agent system support
 */
export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }).unique(),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
    
    // Agent system fields
    inviterId: int("inviter_id"),
    inviteCode: varchar("invite_code", { length: 20 }).notNull().unique(),
    invitePath: varchar("invite_path", { length: 500 }), // Path: 1/3/10/25
    directCount: tinyint("direct_count").default(0), // Direct referrals (max 5)
    
    // Wallet and activation
    trc20WalletAddress: varchar("trc20_wallet_address", { length: 100 }),
    isActivated: boolean("is_activated").default(false),
    
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  },
  (table) => ({
    inviterIdIdx: index("idx_inviter_id").on(table.inviterId),
    inviteCodeIdx: index("idx_invite_code").on(table.inviteCode),
    activatedIdx: index("idx_is_activated").on(table.isActivated),
    openIdUnique: unique("uq_openId").on(table.openId),
  })
);

/**
 * Assets table for user financial records
 */
export const assets = mysqlTable(
  "assets",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull().default("0"),
    frozenAmount: decimal("frozen_amount", { precision: 15, scale: 2 }).notNull().default("0"),
    availableAmount: decimal("available_amount", { precision: 15, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_user_id").on(table.userId),
    fkUserId: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }),
  })
);

/**
 * Deposits table for tracking user deposits
 */
export const deposits = mysqlTable(
  "deposits",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    status: mysqlEnum("status", ["pending", "confirmed", "rejected"]).default("pending").notNull(),
    transactionHash: varchar("transaction_hash", { length: 128 }),
    confirmedAt: timestamp("confirmed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_deposit_user_id").on(table.userId),
    statusIdx: index("idx_deposit_status").on(table.status),
    fkUserId: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }),
  })
);

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = typeof assets.$inferInsert;
export type Deposit = typeof deposits.$inferSelect;
export type InsertDeposit = typeof deposits.$inferInsert;