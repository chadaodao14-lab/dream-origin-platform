import { describe, it, expect, beforeEach } from "vitest";
import {
  logger,
  LogLevel,
} from "./_core/logger";
import {
  AppError,
  ErrorCode,
  AuthError,
  ValidationError,
  NotFoundError,
  BusinessError,
  isAppError,
  toAppError,
} from "./_core/errors";
import {
  handleError,
  generateRequestId,
  appErrorToTRPCError,
  createErrorResponse,
  createSuccessResponse,
} from "./_core/errorHandler";

describe("Error Handling System", () => {
  beforeEach(() => {
    logger.clear();
  });

  describe("Logger", () => {
    it("should create logger instance", () => {
      expect(logger).toBeDefined();
    });

    it("should log info messages", () => {
      logger.info("Test info message", { key: "value" });
      const logs = logger.getRecentLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.INFO);
      expect(logs[0].message).toBe("Test info message");
    });

    it("should log warning messages", () => {
      logger.warn("Test warning message");
      const logs = logger.getRecentLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.WARN);
    });

    it("should log error messages with error object", () => {
      const error = new Error("Test error");
      logger.error("Test error message", error);
      const logs = logger.getRecentLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.ERROR);
      expect(logs[0].error).toBeDefined();
      expect(logs[0].error?.message).toBe("Test error");
    });

    it("should record performance metrics", () => {
      logger.performance("Operation completed", 100, { operation: "test" });
      const logs = logger.getRecentLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0].duration).toBe(100);
    });

    it("should filter logs by level", () => {
      logger.debug("Debug message");
      logger.info("Info message");
      logger.warn("Warn message");
      logger.error("Error message", new Error("Test"));

      const errorLogs = logger.filterByLevel(LogLevel.ERROR);
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].message).toBe("Error message");
    });

    it("should get log statistics", () => {
      logger.info("Info");
      logger.info("Info 2");
      logger.warn("Warn");
      logger.error("Error", new Error("Test"));

      const stats = logger.getStats();
      expect(stats[LogLevel.INFO]).toBe(2);
      expect(stats[LogLevel.WARN]).toBe(1);
      expect(stats[LogLevel.ERROR]).toBe(1);
    });

    it("should clear logs", () => {
      logger.info("Test message");
      expect(logger.getRecentLogs()).toHaveLength(1);

      logger.clear();
      expect(logger.getRecentLogs()).toHaveLength(0);
    });
  });

  describe("Custom Error Classes", () => {
    it("should create AppError", () => {
      const error = new AppError(ErrorCode.VALIDATION_ERROR, "Validation failed", 400);
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("Validation failed");
    });

    it("should create AuthError", () => {
      const error = new AuthError("Authentication failed");
      expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(error.statusCode).toBe(401);
    });

    it("should create ValidationError", () => {
      const error = new ValidationError("Invalid input", { field: "email" });
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
      expect(error.details?.field).toBe("email");
    });

    it("should create NotFoundError", () => {
      const error = new NotFoundError("User");
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("User not found");
    });

    it("should create BusinessError", () => {
      const error = new BusinessError("Insufficient balance");
      expect(error.code).toBe(ErrorCode.BUSINESS_ERROR);
      expect(error.statusCode).toBe(400);
    });

    it("should convert AppError to context", () => {
      const error = new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Validation failed",
        400,
        { field: "email" },
        "req-123",
        "user-456"
      );

      const context = error.toContext();
      expect(context.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(context.message).toBe("Validation failed");
      expect(context.statusCode).toBe(400);
      expect(context.requestId).toBe("req-123");
      expect(context.userId).toBe("user-456");
    });

    it("should convert AppError to JSON", () => {
      const error = new AppError(ErrorCode.VALIDATION_ERROR, "Validation failed", 400);
      const json = error.toJSON();
      expect(json.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(json.message).toBe("Validation failed");
    });
  });

  describe("Error Handling Functions", () => {
    it("should identify AppError", () => {
      const appError = new AppError(ErrorCode.VALIDATION_ERROR, "Test");
      expect(isAppError(appError)).toBe(true);

      const regularError = new Error("Test");
      expect(isAppError(regularError)).toBe(false);
    });

    it("should convert Error to AppError", () => {
      const error = new Error("Test error");
      const appError = toAppError(error, "req-123", "user-456");

      expect(isAppError(appError)).toBe(true);
      expect(appError.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(appError.message).toBe("Test error");
      expect(appError.requestId).toBe("req-123");
      expect(appError.userId).toBe("user-456");
    });

    it("should convert string to AppError", () => {
      const appError = toAppError("Test error");
      expect(isAppError(appError)).toBe(true);
      expect(appError.code).toBe(ErrorCode.INTERNAL_ERROR);
    });

    it("should handle error and return both AppError and TRPCError", () => {
      const error = new ValidationError("Invalid input");
      const { error: appError, trpcError } = handleError(error, {
        operation: "testOperation",
      });

      expect(isAppError(appError)).toBe(true);
      expect(trpcError).toBeDefined();
      expect(trpcError.code).toBe("BAD_REQUEST");
    });

    it("should generate unique request IDs", () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it("should convert AppError to TRPCError", () => {
      const appError = new AuthError("Authentication failed");
      const trpcError = appErrorToTRPCError(appError);

      expect(trpcError.code).toBe("UNAUTHORIZED");
      expect(trpcError.message).toBe("Authentication failed");
    });

    it("should create error response", () => {
      const error = new ValidationError("Invalid input", { field: "email" });
      const response = createErrorResponse(error);

      expect(response.success).toBe(false);
      expect(response.error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(response.error.message).toBe("Invalid input");
      expect(response.error.details?.field).toBe("email");
    });

    it("should create success response", () => {
      const data = { id: 1, name: "Test" };
      const response = createSuccessResponse(data, "req-123");

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.requestId).toBe("req-123");
      expect(response.timestamp).toBeDefined();
    });
  });

  describe("Error Logging", () => {
    it("should log error with context", () => {
      const error = new ValidationError("Invalid input");
      handleError(error, {
        operation: "testOperation",
        userId: "user-123",
      });

      const logs = logger.filterByLevel(LogLevel.ERROR);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].message).toContain("testOperation");
    });

    it("should include error details in logs", () => {
      const error = new ValidationError("Invalid input", { field: "email" });
      handleError(error);

      const logs = logger.filterByLevel(LogLevel.ERROR);
      expect(logs).toHaveLength(1);
      expect(logs[0].context?.code).toBe(ErrorCode.VALIDATION_ERROR);
    });
  });

  describe("Error Type Mapping", () => {
    it("should map validation error to BAD_REQUEST", () => {
      const error = new ValidationError("Invalid input");
      const trpcError = appErrorToTRPCError(error);
      expect(trpcError.code).toBe("BAD_REQUEST");
    });

    it("should map auth error to UNAUTHORIZED", () => {
      const error = new AuthError("Auth failed");
      const trpcError = appErrorToTRPCError(error);
      expect(trpcError.code).toBe("UNAUTHORIZED");
    });

    it("should map not found error to NOT_FOUND", () => {
      const error = new NotFoundError("User");
      const trpcError = appErrorToTRPCError(error);
      expect(trpcError.code).toBe("NOT_FOUND");
    });

    it("should map business error to BAD_REQUEST", () => {
      const error = new BusinessError("Insufficient balance");
      const trpcError = appErrorToTRPCError(error);
      expect(trpcError.code).toBe("BAD_REQUEST");
    });
  });

  describe("Error Context Preservation", () => {
    it("should preserve error context through conversion", () => {
      const originalError = new ValidationError("Invalid input", { field: "email" }, "req-123");
      const context = originalError.toContext();

      expect(context.requestId).toBe("req-123");
      expect(context.details?.field).toBe("email");
      expect(context.timestamp).toBeDefined();
    });

    it("should maintain error hierarchy", () => {
      const error = new ValidationError("Invalid input");
      expect(error instanceof AppError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });
});
