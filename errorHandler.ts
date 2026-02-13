/**
 * 错误处理中间件和工具
 */

import { TRPCError } from "@trpc/server";
import { logger } from "./logger";
import { AppError, isAppError, toAppError, ErrorCode } from "./errors";

/**
 * 生成请求 ID
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 将 AppError 转换为 TRPCError
 */
export function appErrorToTRPCError(error: AppError): TRPCError {
  const codeMap: Record<ErrorCode, any> = {
    [ErrorCode.UNAUTHORIZED]: "UNAUTHORIZED",
    [ErrorCode.FORBIDDEN]: "FORBIDDEN",
    [ErrorCode.VALIDATION_ERROR]: "BAD_REQUEST",
    [ErrorCode.INVALID_INPUT]: "BAD_REQUEST",
    [ErrorCode.MISSING_REQUIRED_FIELD]: "BAD_REQUEST",
    [ErrorCode.NOT_FOUND]: "NOT_FOUND",
    [ErrorCode.ALREADY_EXISTS]: "CONFLICT",
    [ErrorCode.CONFLICT]: "CONFLICT",
    [ErrorCode.BUSINESS_ERROR]: "BAD_REQUEST",
    [ErrorCode.INSUFFICIENT_BALANCE]: "BAD_REQUEST",
    [ErrorCode.INVALID_OPERATION]: "BAD_REQUEST",
    [ErrorCode.INVALID_STATUS]: "BAD_REQUEST",
    [ErrorCode.DATABASE_ERROR]: "INTERNAL_SERVER_ERROR",
    [ErrorCode.QUERY_ERROR]: "INTERNAL_SERVER_ERROR",
    [ErrorCode.CONNECTION_ERROR]: "INTERNAL_SERVER_ERROR",
    [ErrorCode.SERVICE_ERROR]: "INTERNAL_SERVER_ERROR",
    [ErrorCode.EXTERNAL_SERVICE_ERROR]: "INTERNAL_SERVER_ERROR",
    [ErrorCode.TIMEOUT]: "TIMEOUT",
    [ErrorCode.INTERNAL_ERROR]: "INTERNAL_SERVER_ERROR",
    [ErrorCode.NOT_IMPLEMENTED]: "NOT_IMPLEMENTED",
    [ErrorCode.RATE_LIMIT_EXCEEDED]: "TOO_MANY_REQUESTS",
    [ErrorCode.INVALID_CREDENTIALS]: "UNAUTHORIZED",
    [ErrorCode.TOKEN_EXPIRED]: "UNAUTHORIZED",
  };

  const trpcCode = codeMap[error.code] || "INTERNAL_SERVER_ERROR";

  return new TRPCError({
    code: trpcCode as any,
    message: error.message,
    cause: error.details,
  });
}

/**
 * 处理错误并返回标准化的错误响应
 */
export function handleError(
  error: unknown,
  context: {
    requestId?: string;
    userId?: string;
    operation?: string;
  } = {}
): {
  error: AppError;
  trpcError: TRPCError;
} {
  const requestId = context.requestId || generateRequestId();
  const appError = toAppError(error, requestId, context.userId);

  // 记录错误
  logger.error(
    `${context.operation || "Operation"} failed`,
    appError,
    {
      code: appError.code,
      statusCode: appError.statusCode,
      details: appError.details,
    },
    requestId
  );

  // 转换为 TRPC 错误
  const trpcError = appErrorToTRPCError(appError);

  return { error: appError, trpcError };
}

/**
 * 异步错误包装器
 */
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  operation?: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const requestId = generateRequestId();
    const startTime = Date.now();

    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;

      if (operation) {
        logger.performance(`${operation} completed`, duration, {}, requestId);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const appError = toAppError(error, requestId);

      logger.error(
        `${operation || "Operation"} failed after ${duration}ms`,
        appError,
        {
          code: appError.code,
          statusCode: appError.statusCode,
          details: appError.details,
        },
        requestId
      );

      throw appErrorToTRPCError(appError);
    }
  };
}

/**
 * 同步错误包装器
 */
export function syncHandler<T extends any[], R>(
  fn: (...args: T) => R,
  operation?: string
): (...args: T) => R {
  return (...args: T): R => {
    const requestId = generateRequestId();
    const startTime = Date.now();

    try {
      const result = fn(...args);
      const duration = Date.now() - startTime;

      if (operation) {
        logger.performance(`${operation} completed`, duration, {}, requestId);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const appError = toAppError(error, requestId);

      logger.error(
        `${operation || "Operation"} failed after ${duration}ms`,
        appError,
        {
          code: appError.code,
          statusCode: appError.statusCode,
          details: appError.details,
        },
        requestId
      );

      throw appErrorToTRPCError(appError);
    }
  };
}

/**
 * 创建错误响应对象
 */
export function createErrorResponse(error: AppError) {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: error.timestamp,
      requestId: error.requestId,
    },
  };
}

/**
 * 创建成功响应对象
 */
export function createSuccessResponse<T>(data: T, requestId?: string) {
  return {
    success: true,
    data,
    requestId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 验证和规范化错误
 */
export function normalizeError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return toAppError(error);
  }

  return toAppError(new Error(String(error)));
}
