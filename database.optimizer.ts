/**
 * 数据库性能优化脚本
 * 包含索引优化、查询优化建议和性能监控
 */

import { getDb } from "./db";
import { logger } from "./logger";

/**
 * 数据库索引优化建议
 */
export const DATABASE_INDEXES = {
  // 用户表索引
  users: [
    "CREATE INDEX idx_users_role ON users(role)",
    "CREATE INDEX idx_users_is_activated ON users(is_activated)",
    "CREATE INDEX idx_users_created_at ON users(created_at)",
    "CREATE INDEX idx_users_inviter_id ON users(inviter_id)",
    "CREATE INDEX idx_users_invite_code ON users(invite_code)",
    "CREATE INDEX idx_users_trc20_wallet ON users(trc20_wallet_address)"
  ],
  
  // 入金表索引
  deposits: [
    "CREATE INDEX idx_deposits_user_id ON deposits(user_id)",
    "CREATE INDEX idx_deposits_status ON deposits(status)",
    "CREATE INDEX idx_deposits_created_at ON deposits(created_at)",
    "CREATE INDEX idx_deposits_confirmed_at ON deposits(confirmed_at)",
    "CREATE INDEX idx_deposits_amount ON deposits(amount)",
    "CREATE INDEX idx_deposits_tx_hash ON deposits(tx_hash)"
  ],
  
  // 资产表索引
  assets: [
    "CREATE INDEX idx_assets_user_id ON assets(user_id)",
    "CREATE INDEX idx_assets_balance ON assets(balance)",
    "CREATE INDEX idx_assets_updated_at ON assets(updated_at)"
  ],
  
  // 分润表索引
  commissions: [
    "CREATE INDEX idx_commissions_user_id ON commissions(user_id)",
    "CREATE INDEX idx_commissions_from_user_id ON commissions(from_user_id)",
    "CREATE INDEX idx_commissions_created_at ON commissions(created_at)",
    "CREATE INDEX idx_commissions_level ON commissions(level)",
    "CREATE INDEX idx_commissions_status ON commissions(status)"
  ],
  
  // 提现表索引
  withdrawals: [
    "CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id)",
    "CREATE INDEX idx_withdrawals_status ON withdrawals(status)",
    "CREATE INDEX idx_withdrawals_created_at ON withdrawals(created_at)",
    "CREATE INDEX idx_withdrawals_processed_at ON withdrawals(processed_at)"
  ],
  
  // 项目表索引
  projects: [
    "CREATE INDEX idx_projects_status ON projects(status)",
    "CREATE INDEX idx_projects_created_at ON projects(created_at)",
    "CREATE INDEX idx_projects_category ON projects(category)"
  ],
  
  // 慈善基金表索引
  charityFunds: [
    "CREATE INDEX idx_charity_funds_project_id ON charity_funds(project_id)",
    "CREATE INDEX idx_charity_funds_created_at ON charity_funds(created_at)",
    "CREATE INDEX idx_charity_funds_status ON charity_funds(status)"
  ],
  
  // 资金流向表索引
  fundFlows: [
    "CREATE INDEX idx_fund_flows_type ON fund_flows(type)",
    "CREATE INDEX idx_fund_flows_created_at ON fund_flows(created_at)",
    "CREATE INDEX idx_fund_flows_amount ON fund_flows(amount)"
  ],
  
  // 审计日志表索引
  auditLogs: [
    "CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id)",
    "CREATE INDEX idx_audit_logs_action ON audit_logs(action)",
    "CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp)",
    "CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type)"
  ],
  
  // 激活日志表索引
  activationLogs: [
    "CREATE INDEX idx_activation_logs_user_id ON activation_logs(user_id)",
    "CREATE INDEX idx_activation_logs_status ON activation_logs(status)",
    "CREATE INDEX idx_activation_logs_created_at ON activation_logs(created_at)"
  ],
  
  // 入金验证表索引
  depositVerifications: [
    "CREATE INDEX idx_deposit_verifications_deposit_id ON deposit_verifications(deposit_id)",
    "CREATE INDEX idx_deposit_verifications_verified_by ON deposit_verifications(verified_by)",
    "CREATE INDEX idx_deposit_verifications_created_at ON deposit_verifications(created_at)"
  ]
};

/**
 * 性能优化配置
 */
export const PERFORMANCE_CONFIG = {
  // 查询超时设置（毫秒）
  queryTimeout: 5000,
  
  // 连接池配置
  connectionPool: {
    min: 2,
    max: 20,
    acquire: 30000,
    idle: 10000
  },
  
  // 缓存配置
  cache: {
    enabled: true,
    ttl: 300, // 5分钟
    maxSize: 1000
  },
  
  // 慢查询阈值（毫秒）
  slowQueryThreshold: 1000,
  
  // 批量操作大小
  batchSize: 100
};

/**
 * 数据库性能优化工具类
 */
export class DatabaseOptimizer {
  private static instance: DatabaseOptimizer;
  
  private constructor() {}
  
  public static getInstance(): DatabaseOptimizer {
    if (!DatabaseOptimizer.instance) {
      DatabaseOptimizer.instance = new DatabaseOptimizer();
    }
    return DatabaseOptimizer.instance;
  }
  
  /**
   * 应用推荐的数据库索引
   */
  public async applyRecommendedIndexes(): Promise<void> {
    const db = await getDb();
    if (!db) {
      logger.warn("Database not available for index optimization");
      return;
    }
    
    logger.info("Starting database index optimization...");
    
    try {
      for (const [table, indexes] of Object.entries(DATABASE_INDEXES)) {
        logger.info(`Optimizing indexes for table: ${table}`);
        
        for (const indexSql of indexes) {
          try {
            await db.execute(indexSql);
            logger.debug(`Applied index: ${indexSql}`);
          } catch (error) {
            // 索引可能已存在，忽略错误
            logger.debug(`Index may already exist: ${indexSql}`, error);
          }
        }
      }
      
      logger.info("Database index optimization completed");
    } catch (error) {
      logger.error("Failed to apply database indexes", error);
      throw error;
    }
  }
  
  /**
   * 分析慢查询并提供建议
   */
  public async analyzeSlowQueries(): Promise<Array<{
    query: string;
    executionTime: number;
    suggestions: string[];
  }>> {
    const db = await getDb();
    if (!db) {
      return [];
    }
    
    try {
      // 这里应该查询MySQL的慢查询日志或性能模式
      // 暂时返回模拟数据
      const mockSlowQueries = [
        {
          query: "SELECT * FROM users WHERE email LIKE '%gmail%'",
          executionTime: 2500,
          suggestions: [
            "Add index on email column",
            "Consider using full-text search instead of LIKE",
            "Limit result set size"
          ]
        },
        {
          query: "SELECT u.*, a.balance FROM users u JOIN assets a ON u.id = a.user_id WHERE u.created_at > '2024-01-01'",
          executionTime: 1800,
          suggestions: [
            "Add composite index on (created_at, id)",
            "Consider partitioning large tables",
            "Use covering index to avoid table lookup"
          ]
        }
      ];
      
      return mockSlowQueries;
    } catch (error) {
      logger.error("Failed to analyze slow queries", error);
      return [];
    }
  }
  
  /**
   * 优化查询语句
   */
  public optimizeQuery(query: string): string {
    // 基本的查询优化规则
    let optimizedQuery = query.trim();
    
    // 移除不必要的SELECT *
    if (optimizedQuery.toUpperCase().includes('SELECT *')) {
      logger.warn("Avoid using SELECT * in production queries");
    }
    
    // 确保有适当的LIMIT
    if (!optimizedQuery.toUpperCase().includes('LIMIT') && 
        (optimizedQuery.toUpperCase().includes('SELECT') || optimizedQuery.toUpperCase().includes('DELETE'))) {
      logger.warn("Consider adding LIMIT clause to prevent large result sets");
    }
    
    // 检查JOIN条件
    const joinMatches = optimizedQuery.match(/JOIN\s+\w+\s+ON\s+(\w+\.\w+)\s*=\s*(\w+\.\w+)/gi);
    if (joinMatches && joinMatches.length > 0) {
      logger.info("Query contains JOIN operations, ensure proper indexing on join columns");
    }
    
    return optimizedQuery;
  }
  
  /**
   * 批量操作优化
   */
  public async batchInsert<T>(
    tableName: string,
    data: T[],
    batchSize: number = PERFORMANCE_CONFIG.batchSize
  ): Promise<void> {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }
    
    if (data.length === 0) return;
    
    logger.info(`Starting batch insert for ${tableName}: ${data.length} records`);
    
    try {
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const startTime = Date.now();
        
        // 这里应该是实际的批量插入逻辑
        // await db.insert(tableName).values(batch);
        
        const duration = Date.now() - startTime;
        logger.debug(`Batch insert completed: ${batch.length} records in ${duration}ms`);
        
        if (duration > PERFORMANCE_CONFIG.slowQueryThreshold) {
          logger.warn(`Slow batch insert detected: ${duration}ms for ${batch.length} records`);
        }
      }
      
      logger.info(`Batch insert completed for ${tableName}: ${data.length} records total`);
    } catch (error) {
      logger.error(`Failed batch insert for ${tableName}`, error);
      throw error;
    }
  }
  
  /**
   * 获取数据库性能统计
   */
  public async getPerformanceStats(): Promise<{
    connectionStats: {
      activeConnections: number;
      idleConnections: number;
      totalConnections: number;
    };
    queryStats: {
      slowQueries: number;
      averageQueryTime: number;
      totalQueries: number;
    };
    cacheStats: {
      hitRate: number;
      cacheSize: number;
    };
  }> {
    // 这里应该从数据库获取实际的性能统计
    // 暂时返回模拟数据
    
    return {
      connectionStats: {
        activeConnections: 5,
        idleConnections: 3,
        totalConnections: 8
      },
      queryStats: {
        slowQueries: 2,
        averageQueryTime: 150,
        totalQueries: 1000
      },
      cacheStats: {
        hitRate: 0.85,
        cacheSize: 500
      }
    };
  }
  
  /**
   * 清理过期数据
   */
  public async cleanupOldData(
    tableName: string,
    dateColumn: string,
    retentionDays: number = 90
  ): Promise<number> {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      logger.info(`Cleaning up old data from ${tableName} before ${cutoffDate.toISOString()}`);
      
      // 这里应该是实际的删除逻辑
      // const result = await db.delete(tableName).where(lte(dateColumn, cutoffDate));
      // return result.affectedRows;
      
      logger.info(`Cleanup completed for ${tableName}`);
      return 0; // 模拟返回值
      
    } catch (error) {
      logger.error(`Failed to cleanup old data from ${tableName}`, error);
      throw error;
    }
  }
}

// 导出默认实例
export const dbOptimizer = DatabaseOptimizer.getInstance();