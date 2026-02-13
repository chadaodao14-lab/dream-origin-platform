/**
 * 自定义错误类和错误处理工具
 */

export enum ErrorCode {
  // 认证错误
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",

  // 验证错误
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",

  // 资源错误
  NOT_FOUND = "NOT_FOUND",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  CONFLICT = "CONFLICT",

  // 业务逻辑错误
  BUSINESS_ERROR = "BUSINESS_ERROR",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  INVALID_OPERATION = "INVALID_OPERATION",
  INVALID_STATUS = "INVALID_STATUS",

  // 数据库错误
  DATABASE_ERROR = "DATABASE_ERROR",
  QUERY_ERROR = "QUERY_ERROR",
  CONNECTION_ERROR = "CONNECTION_ERROR",

  // 服务错误
  SERVICE_ERROR = "SERVICE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  TIMEOUT = "TIMEOUT",

  // 系统错误
  INTERNAL_ERROR = "INTERNAL_ERROR",
  NOT_IMPLEMENTED = "NOT_IMPLEMENTED",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
}

export interface ErrorContext {
  code: ErrorCode;
  statusCode: number;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId?: string;
  userId?: string;
}

/**
 * 应用自定义错误类
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;
  public readonly timestamp: string;
  public readonly requestId?: string;
  public readonly userId?: string;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: Record<string, any>,
    requestId?: string,
    userId?: string
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;
    this.userId = userId;

    // 维持正确的原型链
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * 转换为错误上下文对象
   */
  toContext(): ErrorContext {
    return {
      code: this.code,
      statusCode: this.statusCode,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      requestId: this.requestId,
      userId: this.userId,
    };
  }

  /**
   * 转换为 JSON
   */
  toJSON(): ErrorContext {
    return this.toContext();
  }
}

/**
 * 认证错误
 */
export class AuthError extends AppError {
  constructor(message: string = "Authentication failed", details?: Record<string, any>, requestId?: string) {
    super(ErrorCode.UNAUTHORIZED, message, 401, details, requestId);
    this.name = "AuthError";
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

/**
 * 授权错误
 */
export class ForbiddenError extends AppError {
  constructor(message: string = "Access denied", details?: Record<string, any>, requestId?: string) {
    super(ErrorCode.FORBIDDEN, message, 403, details, requestId);
    this.name = "ForbiddenError";
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * 验证错误
 */
export class ValidationError extends AppError {
  constructor(message: string = "Validation failed", details?: Record<string, any>, requestId?: string) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details, requestId);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * 未找到错误
 */
export class NotFoundError extends AppError {
  constructor(resource: string = "Resource", requestId?: string) {
    super(ErrorCode.NOT_FOUND, `${resource} not found`, 404, undefined, requestId);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * 冲突错误
 */
export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists", details?: Record<string, any>, requestId?: string) {
    super(ErrorCode.CONFLICT, message, 409, details, requestId);
    this.name = "ConflictError";
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * 业务逻辑错误
 */
export class BusinessError extends AppError {
  constructor(message: string, details?: Record<string, any>, requestId?: string) {
    super(ErrorCode.BUSINESS_ERROR, message, 400, details, requestId);
    this.name = "BusinessError";
    Object.setPrototypeOf(this, BusinessError.prototype);
  }
}

/**
 * 数据库错误
 */
export class DatabaseError extends AppError {
  constructor(message: string = "Database operation failed", details?: Record<string, any>, requestId?: string) {
    super(ErrorCode.DATABASE_ERROR, message, 500, details, requestId);
    this.name = "DatabaseError";
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * 服务错误
 */
export class ServiceError extends AppError {
  constructor(message: string = "Service error", details?: Record<string, any>, requestId?: string) {
    super(ErrorCode.SERVICE_ERROR, message, 500, details, requestId);
    this.name = "ServiceError";
    Object.setPrototypeOf(this, ServiceError.prototype);
  }
}

/**
 * 检查错误是否是 AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * 将任意错误转换为 AppError
 */
export function toAppError(error: unknown, requestId?: string, userId?: string): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(
      ErrorCode.INTERNAL_ERROR,
      error.message,
      500,
      { originalError: error.name },
      requestId,
      userId
    );
  }

  return new AppError(
    ErrorCode.INTERNAL_ERROR,
    String(error),
    500,
    { originalError: typeof error },
    requestId,
    userId
  );
}

/**
 * 获取 HTTP 状态码对应的错误代码
 */
export function getErrorCodeByStatus(statusCode: number): ErrorCode {
  switch (statusCode) {
    case 400:
      return ErrorCode.VALIDATION_ERROR;
    case 401:
      return ErrorCode.UNAUTHORIZED;
    case 403:
      return ErrorCode.FORBIDDEN;
    case 404:
      return ErrorCode.NOT_FOUND;
    case 409:
      return ErrorCode.CONFLICT;
    case 429:
      return ErrorCode.RATE_LIMIT_EXCEEDED;
    case 500:
      return ErrorCode.INTERNAL_ERROR;
    case 503:
      return ErrorCode.SERVICE_ERROR;
    default:
      return ErrorCode.INTERNAL_ERROR;
  }
}
