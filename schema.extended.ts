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
 * 核心用户表 - 扩展版
 * 添加了更多审计和追踪字段
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
    
    // 代理系统字段
    inviterId: int("inviter_id"),
    inviteCode: varchar("invite_code", { length: 20 }).notNull().unique(),
    invitePath: varchar("invite_path", { length: 500 }), // 路径: 1/3/10/25
    directCount: tinyint("direct_count").default(0), // 直推人数 (最大5人)
    
    // 钱包和激活状态
    trc20WalletAddress: varchar("trc20_wallet_address", { length: 100 }),
    isActivated: boolean("is_activated").default(false),
    
    // 审计追踪字段
    createdBy: int("created_by"), // 创建者ID
    updatedBy: int("updated_by"), // 最后更新者ID
    activatedAt: timestamp("activated_at"), // 激活时间
    firstDepositAt: timestamp("first_deposit_at"), // 首次入金时间
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
  },
  (table) => ({
    inviterIdIdx: index("idx_inviter_id").on(table.inviterId),
    inviteCodeIdx: index("idx_invite_code").on(table.inviteCode),
    activatedIdx: index("idx_is_activated").on(table.isActivated),
    openIdUnique: unique("uq_openId").on(table.openId),
  })
);

/**
 * 入金记录表 - 扩展版
 * 添加了确认/拒绝相关的审计字段
 */
export const deposits = mysqlTable(
  "deposits",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    txHash: varchar("tx_hash", { length: 100 }).notNull().unique(),
    status: mysqlEnum("status", ["pending", "confirmed", "rejected"]).default("pending").notNull(),
    proofFile: varchar("proof_file", { length: 255 }),
    remark: text("remark"),
    
    // 确认相关信息
    confirmedBy: int("confirmed_by"), // 确认者ID
    confirmedAt: timestamp("confirmed_at"), // 确认时间
    confirmationRemark: text("confirmation_remark"), // 确认备注
    
    // 拒绝相关信息
    rejectedBy: int("rejected_by"), // 拒绝者ID
    rejectedAt: timestamp("rejected_at"), // 拒绝时间
    rejectionReason: text("rejection_reason"), // 拒绝原因
    
    // 验证状态
    verificationStatus: mysqlEnum("verification_status", ["unverified", "verified", "failed"]).default("unverified"),
    verificationDetails: json("verification_details"), // 验证详情
    
    // 重试机制
    retryCount: int("retry_count").default(0),
    lastRetryAt: timestamp("last_retry_at"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_deposits_user_id").on(table.userId),
    statusIdx: index("idx_deposits_status").on(table.status),
    txHashUnique: unique("uq_tx_hash").on(table.txHash),
    confirmedByIdx: index("idx_deposits_confirmed_by").on(table.confirmedBy),
    rejectedByIdx: index("idx_deposits_rejected_by").on(table.rejectedBy),
  })
);

/**
 * 分润记录表
 */
export const commissions = mysqlTable(
  "commissions",
  {
    id: int("id").autoincrement().primaryKey(),
    sourceUserId: int("source_user_id").notNull(), // 产生分润的用户
    targetUserId: int("target_user_id").notNull(), // 获得分润的用户
    level: int("level").notNull(), // 分润层级 (1-9级)
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    status: mysqlEnum("status", ["pending", "confirmed"]).default("confirmed").notNull(),
    relatedDepositId: int("related_deposit_id"), // 关联的入金ID
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    sourceUserIdIdx: index("idx_commissions_source").on(table.sourceUserId),
    targetUserIdIdx: index("idx_commissions_target").on(table.targetUserId),
    levelIdx: index("idx_commissions_level").on(table.level),
  })
);

/**
 * 用户资产表
 */
export const assets = mysqlTable(
  "assets",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull().unique(),
    availableBalance: decimal("available_balance", { precision: 12, scale: 2 }).default("0"),
    frozenBalance: decimal("frozen_balance", { precision: 12, scale: 2 }).default("0"),
    totalCommission: decimal("total_commission", { precision: 12, scale: 2 }).default("0"),
    monthlyIncome: decimal("monthly_income", { precision: 12, scale: 2 }).default("0"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdUnique: unique("uq_assets_user_id").on(table.userId),
  })
);

/**
 * 资金流向追踪表
 */
export const fundFlows = mysqlTable(
  "fund_flows",
  {
    id: int("id").autoincrement().primaryKey(),
    type: mysqlEnum("type", ["deposit", "commission", "withdrawal", "charity", "startup", "transfer"]).notNull(),
    direction: mysqlEnum("direction", ["income", "outcome"]).notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    source: varchar("source", { length: 50 }), // 资金来源
    relatedId: int("related_id"), // 关联记录ID
    remark: text("remark"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    typeIdx: index("idx_fund_flows_type").on(table.type),
    directionIdx: index("idx_fund_flows_direction").on(table.direction),
    relatedIdIdx: index("idx_fund_flows_related_id").on(table.relatedId),
  })
);

/**
 * 提现申请表
 */
export const withdrawals = mysqlTable(
  "withdrawals",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    walletAddress: varchar("wallet_address", { length: 100 }).notNull(),
    status: mysqlEnum("status", ["pending", "processing", "completed", "rejected"]).default("pending").notNull(),
    remark: text("remark"),
    processedBy: int("processed_by"), // 处理者ID
    processedAt: timestamp("processed_at"), // 处理时间
    rejectionReason: text("rejection_reason"), // 拒绝原因
    txHash: varchar("tx_hash", { length: 100 }), // 提现交易哈希
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_withdrawals_user_id").on(table.userId),
    statusIdx: index("idx_withdrawals_status").on(table.status),
    processedByIdx: index("idx_withdrawals_processed_by").on(table.processedBy),
  })
);

/**
 * 创业项目表
 */
export const projects = mysqlTable(
  "projects",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("owner_id").notNull(), // 项目发起人
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    targetAmount: decimal("target_amount", { precision: 12, scale: 2 }).notNull(),
    investedAmount: decimal("invested_amount", { precision: 12, scale: 2 }).default("0"),
    status: mysqlEnum("status", ["pending", "active", "completed", "cancelled"]).default("pending").notNull(),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    ownerIdIdx: index("idx_projects_owner_id").on(table.ownerId),
    statusIdx: index("idx_projects_status").on(table.status),
  })
);

/**
 * 项目资金分配表
 */
export const projectFunds = mysqlTable(
  "project_funds",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("project_id").notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    direction: mysqlEnum("direction", ["allocate", "return"]).notNull(), // 分配/返还
    remark: text("remark"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    projectIdIdx: index("idx_project_funds_project_id").on(table.projectId),
    directionIdx: index("idx_project_funds_direction").on(table.direction),
  })
);

/**
 * 慈善基金表
 */
export const charityFunds = mysqlTable(
  "charity_funds",
  {
    id: int("id").autoincrement().primaryKey(),
    balance: decimal("balance", { precision: 12, scale: 2 }).default("0"),
    totalDonated: decimal("total_donated", { precision: 12, scale: 2 }).default("0"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  }
);

/**
 * 慈善捐赠记录表
 */
export const charityDonations = mysqlTable(
  "charity_donations",
  {
    id: int("id").autoincrement().primaryKey(),
    charityFundId: int("charity_fund_id").notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    donor: varchar("donor", { length: 100 }), // 捐赠方
    purpose: text("purpose"), // 用途
    remark: text("remark"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    charityFundIdIdx: index("idx_charity_donations_fund_id").on(table.charityFundId),
  })
);

/**
 * 新增：用户激活日志表
 */
export const activationLogs = mysqlTable(
  "activation_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    status: mysqlEnum("status", ["pending", "activated", "failed"]).notNull(),
    reason: text("reason"), // 激活/失败原因
    operatedBy: int("operated_by").notNull(), // 操作者ID
    metadata: json("metadata"), // 额外信息
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_activation_logs_user_id").on(table.userId),
    statusIdx: index("idx_activation_logs_status").on(table.status),
    operatedByIdx: index("idx_activation_logs_operated_by").on(table.operatedBy),
  })
);

/**
 * 新增：入金验证记录表
 */
export const depositVerifications = mysqlTable(
  "deposit_verifications",
  {
    id: int("id").autoincrement().primaryKey(),
    depositId: int("deposit_id").notNull(),
    verificationMethod: mysqlEnum("verification_method", ["manual", "auto", "blockchain"]).notNull(),
    verificationResult: boolean("verification_result").notNull(),
    verificationDetails: json("verification_details"), // 验证详情
    verifiedBy: int("verified_by"), // 验证者ID
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    depositIdIdx: index("idx_deposit_verifications_deposit_id").on(table.depositId),
    verifiedByIdx: index("idx_deposit_verifications_verified_by").on(table.verifiedBy),
  })
);

/**
 * 新增：操作审计日志表
 */
export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id"), // 操作用户ID
    action: varchar("action", { length: 100 }).notNull(), // 操作类型
    resourceType: varchar("resource_type", { length: 50 }), // 资源类型
    resourceId: int("resource_id"), // 资源ID
    details: json("details"), // 操作详情
    ipAddress: varchar("ip_address", { length: 45 }), // IP地址
    userAgent: text("user_agent"), // 用户代理
    status: mysqlEnum("status", ["success", "failed"]).notNull(), // 操作状态
    errorMessage: text("error_message"), // 错误信息
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_audit_logs_user_id").on(table.userId),
    actionIdx: index("idx_audit_logs_action").on(table.action),
    resourceTypeIdx: index("idx_audit_logs_resource_type").on(table.resourceType),
    createdAtIdx: index("idx_audit_logs_created_at").on(table.createdAt),
  })
);

/**
 * 新增：系统配置表
 */
export const systemConfigs = mysqlTable(
  "system_configs",
  {
    id: int("id").autoincrement().primaryKey(),
    key: varchar("key", { length: 100 }).notNull().unique(),
    value: text("value").notNull(),
    description: text("description"),
    category: varchar("category", { length: 50 }), // 配置分类
    valueType: mysqlEnum("value_type", ["string", "number", "boolean", "json"]).default("string"),
    isEditable: boolean("is_editable").default(true), // 是否可编辑
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    keyUnique: unique("uq_system_configs_key").on(table.key),
    categoryIdx: index("idx_system_configs_category").on(table.category),
  })
);

/**
 * 新增：配置变更历史表
 */
export const configHistories = mysqlTable(
  "config_histories",
  {
    id: int("id").autoincrement().primaryKey(),
    configKey: varchar("config_key", { length: 100 }).notNull(),
    oldValue: text("old_value"),
    newValue: text("new_value").notNull(),
    changedBy: int("changed_by").notNull(), // 变更者ID
    changeReason: text("change_reason"), // 变更原因
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    configKeyIdx: index("idx_config_histories_config_key").on(table.configKey),
    changedByIdx: index("idx_config_histories_changed_by").on(table.changedBy),
  })
);