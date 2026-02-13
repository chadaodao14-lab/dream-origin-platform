/**
 * 集成错误处理系统
 * 整合所有错误处理组件，提供统一的错误管理接口
 */

import { logger, LogLevel } from "./logger";
import { 
  AppError, 
  AuthError, 
  ForbiddenError, 
  ValidationError, 
  NotFoundError, 
  BusinessError,
  DatabaseError,
  ServiceError,
  ErrorCode,
  isAppError,
  toAppError
} from "./errors";
import { 
  generateRequestId, 
  appErrorToTRPCError, 
  handleError, 
  asyncHandler, 
  syncHandler,
  createErrorResponse,
  createSuccessResponse
} from "./errorHandler";
import { 
  errorMiddleware, 
  withErrorHandling, 
  withQueryLogging, 
  withMutationLogging 
} from "./trpcErrorMiddleware";

/**
 * 错误处理系统配置
 */
export interface ErrorHandlingConfig {
  /** 是否在生产环境中隐藏详细错误信息 */
  hideDetailsInProduction: boolean;
  /** 默认的请求超时时间（毫秒） */
  defaultTimeout: number;
  /** 是否启用详细的性能监控 */
  enablePerformanceMonitoring: boolean;
  /** 错误报告的目标URL */
  errorReportingUrl?: string;
}

/**
 * 全局错误处理系统类
 */
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private config: ErrorHandlingConfig;

  private constructor(config: Partial<ErrorHandlingConfig> = {}) {
    this.config = {
      hideDetailsInProduction: true,
      defaultTimeout: 30000,
      enablePerformanceMonitoring: true,
      ...config
    };
  }

  /**
   * 获取单例实例
   */
  public static getInstance(config?: Partial<ErrorHandlingConfig>): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler(config);
    }
    return GlobalErrorHandler.instance;
  }

  /**
   * 处理API错误并返回标准化响应
   */
  public handleApiError(
    error: unknown,
    context: {
      operation?: string;
      userId?: string;
      requestId?: string;
      [key: string]: any;
    } = {}
  ): { error: AppError; response: any } {
    const requestId = context.requestId || generateRequestId();
    const appError = toAppError(error, requestId, context.userId);

    // 记录错误日志
    logger.error(
      `${context.operation || 'API Operation'} failed`,
      appError,
      {
        code: appError.code,
        statusCode: appError.statusCode,
        ...context
      },
      requestId
    );

    // 创建错误响应
    const response = createErrorResponse(appError);
    
    // 在生产环境中隐藏敏感信息
    if (this.config.hideDetailsInProduction && process.env.NODE_ENV === 'production') {
      response.error.message = this.getGenericErrorMessage(appError.code);
      delete response.error.details;
    }

    return { error: appError, response };
  }

  /**
   * 处理数据库错误
   */
  public handleDatabaseError(
    error: unknown,
    operation: string,
    context: Record<string, any> = {}
  ): never {
    const dbError = new DatabaseError(
      `Database operation failed: ${operation}`,
      { 
        originalError: error instanceof Error ? error.message : String(error),
        operation,
        ...context 
      }
    );
    
    logger.error(`Database error in ${operation}`, dbError, context);
    throw dbError;
  }

  /**
   * 处理业务逻辑错误
   */
  public handleBusinessError(
    message: string,
    details?: Record<string, any>,
    code: ErrorCode = ErrorCode.BUSINESS_ERROR
  ): never {
    const businessError = new BusinessError(message, details);
    logger.warn(`Business error: ${message}`, businessError, details ? JSON.stringify(details) : undefined);
    throw businessError;
  }

  /**
   * 处理验证错误
   */
  public handleValidationError(
    message: string,
    field?: string,
    value?: any
  ): never {
    const validationError = new ValidationError(message, { field, value });
    logger.warn(`Validation error: ${message}`, validationError, field ? `Field: ${field}, Value: ${value}` : undefined);
    throw validationError;
  }

  /**
   * 处理认证错误
   */
  public handleAuthError(message: string = "Authentication failed"): never {
    const authError = new AuthError(message);
    logger.warn(`Authentication error: ${message}`, authError);
    throw authError;
  }

  /**
   * 处理授权错误
   */
  public handleForbiddenError(message: string = "Access denied"): never {
    const forbiddenError = new ForbiddenError(message);
    logger.warn(`Authorization error: ${message}`, forbiddenError);
    throw forbiddenError;
  }

  /**
   * 处理未找到错误
   */
  public handleNotFoundError(resource: string = "Resource"): never {
    const notFoundError = new NotFoundError(resource);
    logger.warn(`${resource} not found`, notFoundError);
    throw notFoundError;
  }

  /**
   * 执行带超时的异步操作
   */
  public async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = this.config.defaultTimeout,
    operation: string = "Operation"
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`${operation} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      promise
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * 记录性能指标
   */
  public logPerformance(
    operation: string,
    duration: number,
    context: Record<string, any> = {},
    requestId?: string
  ): void {
    if (this.config.enablePerformanceMonitoring) {
      logger.performance(operation, duration, context, requestId);
      
      // 如果性能较差，记录警告
      if (duration > 5000) {
        logger.warn(`Slow operation detected: ${operation}`, { duration, ...context }, requestId);
      }
    }
  }

  /**
   * 获取通用错误消息（用于生产环境）
   */
  private getGenericErrorMessage(code: ErrorCode): string {
    const genericMessages: Record<ErrorCode, string> = {
      [ErrorCode.UNAUTHORIZED]: "Authentication required",
      [ErrorCode.FORBIDDEN]: "Access denied",
      [ErrorCode.VALIDATION_ERROR]: "Invalid input data",
      [ErrorCode.NOT_FOUND]: "Resource not found",
      [ErrorCode.BUSINESS_ERROR]: "Operation failed",
      [ErrorCode.DATABASE_ERROR]: "Database error",
      [ErrorCode.SERVICE_ERROR]: "Service temporarily unavailable",
      [ErrorCode.INTERNAL_ERROR]: "Internal server error",
      // 其他错误代码...
      [ErrorCode.INVALID_INPUT]: "Invalid input",
      [ErrorCode.MISSING_REQUIRED_FIELD]: "Required field missing",
      [ErrorCode.ALREADY_EXISTS]: "Resource already exists",
      [ErrorCode.CONFLICT]: "Conflict detected",
      [ErrorCode.INSUFFICIENT_BALANCE]: "Insufficient balance",
      [ErrorCode.INVALID_OPERATION]: "Invalid operation",
      [ErrorCode.INVALID_STATUS]: "Invalid status",
      [ErrorCode.QUERY_ERROR]: "Query execution failed",
      [ErrorCode.CONNECTION_ERROR]: "Connection error",
      [ErrorCode.EXTERNAL_SERVICE_ERROR]: "External service error",
      [ErrorCode.TIMEOUT]: "Request timeout",
      [ErrorCode.NOT_IMPLEMENTED]: "Feature not implemented",
      [ErrorCode.RATE_LIMIT_EXCEEDED]: "Rate limit exceeded",
      [ErrorCode.INVALID_CREDENTIALS]: "Invalid credentials",
      [ErrorCode.TOKEN_EXPIRED]: "Session expired",
    };

    return genericMessages[code] || "An error occurred";
  }

  /**
   * 获取系统健康状态
   */
  public getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    errors: number;
    warnings: number;
    lastError?: string;
    uptime: number;
  } {
    const stats = logger.getStats();
    const recentLogs = logger.getRecentLogs(100);
    
    const errors = stats[LogLevel.ERROR] + stats[LogLevel.FATAL];
    const warnings = stats[LogLevel.WARN];
    
    const lastError = recentLogs
      .filter(log => log.level === LogLevel.ERROR || log.level === LogLevel.FATAL)
      .slice(-1)[0]?.message || undefined;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (errors > 10) status = 'unhealthy';
    else if (errors > 0 || warnings > 20) status = 'degraded';

    return {
      status,
      errors,
      warnings,
      lastError,
      uptime: process.uptime()
    };
  }

  /**
   * 清理错误日志
   */
  public clearErrorLogs(): void {
    logger.clear();
    logger.info("Error logs cleared");
  }

  /**
   * 导出错误统计报告
   */
  public exportErrorReport(): {
    summary: {
      totalErrors: number;
      totalWarnings: number;
      errorRate: number;
      uptime: number;
    };
    topErrors: Array<{
      message: string;
      count: number;
      firstOccurrence: string;
      lastOccurrence: string;
    }>;
    performance: {
      avgResponseTime: number;
      slowOperations: Array<{ operation: string; avgDuration: number }>;
    };
  } {
    const stats = logger.getStats();
    const recentLogs = logger.getRecentLogs(1000);
    
    // 统计错误类型
    const errorCounts: Record<string, { count: number; first: Date; last: Date }> = {};
    let totalOperations = 0;
    let totalDuration = 0;
    const slowOperations: Record<string, number[]> = {};

    recentLogs.forEach(log => {
      // 统计错误
      if (log.level === LogLevel.ERROR || log.level === LogLevel.FATAL) {
        const key = log.message;
        if (!errorCounts[key]) {
          errorCounts[key] = { count: 0, first: new Date(log.timestamp), last: new Date(log.timestamp) };
        }
        errorCounts[key].count++;
        errorCounts[key].last = new Date(log.timestamp);
        if (new Date(log.timestamp) < errorCounts[key].first) {
          errorCounts[key].first = new Date(log.timestamp);
        }
      }
      
      // 统计性能
      if (log.duration !== undefined) {
        totalOperations++;
        totalDuration += log.duration;
        if (log.duration > 1000) { // 慢操作阈值
          const opName = log.message.split(' ')[0] || 'unknown';
          if (!slowOperations[opName]) slowOperations[opName] = [];
          slowOperations[opName].push(log.duration);
        }
      }
    });

    // 格式化top错误
    const topErrors = Object.entries(errorCounts)
      .map(([message, data]) => ({
        message,
        count: data.count,
        firstOccurrence: data.first.toISOString(),
        lastOccurrence: data.last.toISOString()
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 计算慢操作平均时间
    const slowOpStats = Object.entries(slowOperations).map(([operation, durations]) => ({
      operation,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length
    }));

    return {
      summary: {
        totalErrors: stats[LogLevel.ERROR] + stats[LogLevel.FATAL],
        totalWarnings: stats[LogLevel.WARN],
        errorRate: totalOperations > 0 ? (stats[LogLevel.ERROR] + stats[LogLevel.FATAL]) / totalOperations : 0,
        uptime: process.uptime()
      },
      topErrors,
      performance: {
        avgResponseTime: totalOperations > 0 ? totalDuration / totalOperations : 0,
        slowOperations: slowOpStats.sort((a, b) => b.avgDuration - a.avgDuration).slice(0, 5)
      }
    };
  }
}

// 导出默认实例
export const globalErrorHandler = GlobalErrorHandler.getInstance();

// 导出所有工具函数
export {
  logger,
  LogLevel,
  AppError,
  AuthError,
  ForbiddenError,
  ValidationError,
  NotFoundError,
  BusinessError,
  DatabaseError,
  ServiceError,
  ErrorCode,
  isAppError,
  toAppError,
  generateRequestId,
  appErrorToTRPCError,
  handleError,
  asyncHandler,
  syncHandler,
  createErrorResponse,
  createSuccessResponse,
  errorMiddleware,
  withErrorHandling,
  withQueryLogging,
  withMutationLogging
};

// 类型已在类定义中导出