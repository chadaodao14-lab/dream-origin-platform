/**
 * 全局日志服务
 * 提供统一的日志记录、错误追踪和性能监控
 */

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  FATAL = "FATAL",
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  userId?: string;
  requestId?: string;
  duration?: number;
}

export interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  remoteUrl?: string;
}

class Logger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      minLevel: LogLevel.INFO,
      enableConsole: true,
      enableFile: false,
      enableRemote: false,
      ...config,
    };
  }

  /**
   * 检查是否应该记录该级别的日志
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    const minIndex = levels.indexOf(this.config.minLevel);
    const currentIndex = levels.indexOf(level);
    return currentIndex >= minIndex;
  }

  /**
   * 格式化日志条目
   */
  private formatEntry(entry: LogEntry): string {
    const { timestamp, level, message, context, error, userId, requestId, duration } = entry;
    let formatted = `[${timestamp}] [${level}]`;

    if (requestId) formatted += ` [${requestId}]`;
    if (userId) formatted += ` [User: ${userId}]`;

    formatted += ` ${message}`;

    if (context && Object.keys(context).length > 0) {
      formatted += ` ${JSON.stringify(context)}`;
    }

    if (error) {
      formatted += `\n  Error: ${error.name} - ${error.message}`;
      if (error.code) formatted += ` (${error.code})`;
      if (error.stack) formatted += `\n  ${error.stack}`;
    }

    if (duration !== undefined) {
      formatted += ` [${duration}ms]`;
    }

    return formatted;
  }

  /**
   * 记录日志
   */
  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    // 存储到内存
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    const formatted = this.formatEntry(entry);

    // 输出到控制台
    if (this.config.enableConsole) {
      const consoleMethod = this.getConsoleMethod(entry.level);
      consoleMethod(formatted);
    }

    // 发送到远程服务
    if (this.config.enableRemote && this.config.remoteUrl) {
      this.sendRemote(entry).catch((err) => {
        console.error("Failed to send log to remote:", err);
      });
    }
  }

  /**
   * 获取对应的 console 方法
   */
  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.log;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * 发送日志到远程服务
   */
  private async sendRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remoteUrl) return;

    try {
      await fetch(this.config.remoteUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // 静默失败，避免日志系统本身导致应用崩溃
    }
  }

  /**
   * 调试级别日志
   */
  debug(message: string, context?: Record<string, any>, requestId?: string): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message,
      context,
      requestId,
    });
  }

  /**
   * 信息级别日志
   */
  info(message: string, context?: Record<string, any>, requestId?: string): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      context,
      requestId,
    });
  }

  /**
   * 警告级别日志
   */
  warn(message: string, context?: Record<string, any>, requestId?: string): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      context,
      requestId,
    });
  }

  /**
   * 错误级别日志
   */
  error(message: string, error?: Error | unknown, context?: Record<string, any>, requestId?: string): void {
    let errorInfo: LogEntry["error"] | undefined;

    if (error instanceof Error) {
      errorInfo = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    } else if (error) {
      errorInfo = {
        name: "Unknown",
        message: String(error),
      };
    }

    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      context,
      error: errorInfo,
      requestId,
    });
  }

  /**
   * 严重错误级别日志
   */
  fatal(message: string, error?: Error | unknown, context?: Record<string, any>, requestId?: string): void {
    let errorInfo: LogEntry["error"] | undefined;

    if (error instanceof Error) {
      errorInfo = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    } else if (error) {
      errorInfo = {
        name: "Unknown",
        message: String(error),
      };
    }

    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.FATAL,
      message,
      context,
      error: errorInfo,
      requestId,
    });
  }

  /**
   * 记录性能指标
   */
  performance(message: string, duration: number, context?: Record<string, any>, requestId?: string): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      context,
      requestId,
      duration,
    });
  }

  /**
   * 获取最近的日志
   */
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * 按级别过滤日志
   */
  filterByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * 清空日志
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * 获取日志统计
   */
  getStats(): Record<LogLevel, number> {
    const stats: Record<LogLevel, number> = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.ERROR]: 0,
      [LogLevel.FATAL]: 0,
    };

    for (const log of this.logs) {
      stats[log.level]++;
    }

    return stats;
  }
}

// 导出单例
export const logger = new Logger({
  minLevel: process.env.LOG_LEVEL ? (process.env.LOG_LEVEL as LogLevel) : LogLevel.INFO,
  enableConsole: true,
  enableRemote: false,
});

export default logger;
