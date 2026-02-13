/**
 * tRPC 错误处理中间件
 */

import { TRPCError } from "@trpc/server";
import { logger } from "./logger";
import { AppError, isAppError } from "./errors";
import { generateRequestId, appErrorToTRPCError } from "./errorHandler";

/**
 * 错误处理中间件
 * 在所有 tRPC 过程中捕获和处理错误
 */
export const errorMiddleware = async (opts: any) => {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // 记录请求开始
    logger.debug(`tRPC request started: ${opts.path}`, { requestId }, requestId);

    // 执行过程
    const result = await opts.next();

    // 记录请求完成
    const duration = Date.now() - startTime;
    logger.performance(`tRPC request completed: ${opts.path}`, duration, { requestId }, requestId);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    // 记录错误
    if (isAppError(error)) {
      logger.error(
        `tRPC request failed: ${opts.path}`,
        error,
        {
          code: error.code,
          statusCode: error.statusCode,
          duration,
          requestId,
        },
        requestId
      );

      // 转换为 TRPC 错误
      throw appErrorToTRPCError(error);
    } else if (error instanceof TRPCError) {
      logger.error(
        `tRPC request failed: ${opts.path}`,
        error,
        {
          code: error.code,
          duration,
          requestId,
        },
        requestId
      );

      throw error;
    } else if (error instanceof Error) {
      logger.error(
        `tRPC request failed: ${opts.path}`,
        error,
        {
          duration,
          requestId,
        },
        requestId
      );

      // 转换为通用错误
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: process.env.NODE_ENV === "production" ? "Internal server error" : error.message,
        cause: error,
      });
    } else {
      logger.error(
        `tRPC request failed: ${opts.path}`,
        new Error(String(error)),
        {
          duration,
          requestId,
        },
        requestId
      );

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      });
    }
  }
};

/**
 * 创建带有错误处理的过程包装器
 */
export function withErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  operation?: string
): T {
  return (async (...args: any[]) => {
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

      if (isAppError(error)) {
        logger.error(
          `${operation || "Operation"} failed`,
          error,
          {
            code: error.code,
            statusCode: error.statusCode,
            duration,
          },
          requestId
        );

        throw appErrorToTRPCError(error);
      } else if (error instanceof TRPCError) {
        logger.error(
          `${operation || "Operation"} failed`,
          error,
          { duration },
          requestId
        );

        throw error;
      } else if (error instanceof Error) {
        logger.error(
          `${operation || "Operation"} failed`,
          error,
          { duration },
          requestId
        );

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: process.env.NODE_ENV === "production" ? "Internal server error" : error.message,
          cause: error,
        });
      } else {
        logger.error(
          `${operation || "Operation"} failed`,
          new Error(String(error)),
          { duration },
          requestId
        );

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        });
      }
    }
  }) as T;
}

/**
 * 创建带有日志的查询包装器
 */
export function withQueryLogging<T extends (...args: any[]) => any>(
  fn: T,
  operation: string
): T {
  return (async (...args: any[]) => {
    const requestId = generateRequestId();
    const startTime = Date.now();

    logger.debug(`Query started: ${operation}`, {}, requestId);

    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;

      logger.debug(`Query completed: ${operation}`, { duration }, requestId);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(
        `Query failed: ${operation}`,
        error instanceof Error ? error : new Error(String(error)),
        { duration },
        requestId
      );

      throw error;
    }
  }) as T;
}

/**
 * 创建带有日志的变更包装器
 */
export function withMutationLogging<T extends (...args: any[]) => any>(
  fn: T,
  operation: string
): T {
  return (async (...args: any[]) => {
    const requestId = generateRequestId();
    const startTime = Date.now();

    logger.info(`Mutation started: ${operation}`, {}, requestId);

    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;

      logger.info(`Mutation completed: ${operation}`, { duration }, requestId);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(
        `Mutation failed: ${operation}`,
        error instanceof Error ? error : new Error(String(error)),
        { duration },
        requestId
      );

      throw error;
    }
  }) as T;
}
