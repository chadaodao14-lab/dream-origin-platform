/**
 * 前端错误捕获和日志客户端
 */

export enum ClientLogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

export interface ClientLogEntry {
  timestamp: string;
  level: ClientLogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  source: "console" | "error" | "unhandledRejection" | "manual";
}

class ErrorClient {
  private logs: ClientLogEntry[] = [];
  private maxLogs = 100;
  private listeners: ((log: ClientLogEntry) => void)[] = [];

  constructor() {
    this.setupGlobalErrorHandlers();
  }

  /**
   * 设置全局错误处理器
   */
  private setupGlobalErrorHandlers() {
    // 处理未捕获的错误
    window.addEventListener("error", (event) => {
      this.error(
        `Uncaught error: ${event.message}`,
        event.error,
        { filename: event.filename, lineno: event.lineno, colno: event.colno },
        "error"
      );
    });

    // 处理未处理的 Promise 拒绝
    window.addEventListener("unhandledrejection", (event) => {
      this.error(
        `Unhandled promise rejection: ${event.reason}`,
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {},
        "unhandledRejection"
      );
    });
  }

  /**
   * 记录日志
   */
  private log(
    level: ClientLogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error,
    source: ClientLogEntry["source"] = "manual"
  ) {
    const entry: ClientLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      source,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // 存储日志
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // 通知监听器
    this.listeners.forEach((listener) => listener(entry));

    // 输出到控制台
    this.logToConsole(entry);
  }

  /**
   * 输出到控制台
   */
  private logToConsole(entry: ClientLogEntry) {
    const prefix = `[${entry.timestamp}] [${entry.level}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case ClientLogLevel.DEBUG:
        console.debug(message, entry.context);
        break;
      case ClientLogLevel.INFO:
        console.log(message, entry.context);
        break;
      case ClientLogLevel.WARN:
        console.warn(message, entry.context);
        break;
      case ClientLogLevel.ERROR:
        console.error(message, entry.error, entry.context);
        break;
    }
  }

  /**
   * 调试日志
   */
  debug(message: string, context?: Record<string, any>) {
    this.log(ClientLogLevel.DEBUG, message, context);
  }

  /**
   * 信息日志
   */
  info(message: string, context?: Record<string, any>) {
    this.log(ClientLogLevel.INFO, message, context);
  }

  /**
   * 警告日志
   */
  warn(message: string, context?: Record<string, any>) {
    this.log(ClientLogLevel.WARN, message, context);
  }

  /**
   * 错误日志
   */
  error(message: string, error?: Error | unknown, context?: Record<string, any>, source: ClientLogEntry["source"] = "manual") {
    let err: Error | undefined;

    if (error instanceof Error) {
      err = error;
    } else if (error) {
      err = new Error(String(error));
    }

    this.log(ClientLogLevel.ERROR, message, context, err, source);
  }

  /**
   * 获取所有日志
   */
  getLogs(): ClientLogEntry[] {
    return [...this.logs];
  }

  /**
   * 获取最近的日志
   */
  getRecentLogs(count: number = 50): ClientLogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * 按级别过滤日志
   */
  filterByLevel(level: ClientLogLevel): ClientLogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * 清空日志
   */
  clear() {
    this.logs = [];
  }

  /**
   * 添加日志监听器
   */
  addListener(listener: (log: ClientLogEntry) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * 发送日志到服务器
   */
  async sendToServer(logs?: ClientLogEntry[]) {
    try {
      const logsToSend = logs || this.getRecentLogs(50);

      const response = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logs: logsToSend,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });

      if (!response.ok) {
        console.warn("Failed to send logs to server:", response.status);
      }
    } catch (error) {
      console.error("Error sending logs to server:", error);
    }
  }

  /**
   * 获取日志统计
   */
  getStats() {
    const stats = {
      [ClientLogLevel.DEBUG]: 0,
      [ClientLogLevel.INFO]: 0,
      [ClientLogLevel.WARN]: 0,
      [ClientLogLevel.ERROR]: 0,
    };

    for (const log of this.logs) {
      stats[log.level]++;
    }

    return stats;
  }

  /**
   * 导出日志为 JSON
   */
  exportAsJSON(): string {
    return JSON.stringify(
      {
        exportTime: new Date().toISOString(),
        logs: this.logs,
        stats: this.getStats(),
      },
      null,
      2
    );
  }

  /**
   * 导出日志为 CSV
   */
  exportAsCSV(): string {
    const headers = ["Timestamp", "Level", "Message", "Error", "Context"];
    const rows = this.logs.map((log) => [
      log.timestamp,
      log.level,
      log.message,
      log.error ? `${log.error.name}: ${log.error.message}` : "",
      JSON.stringify(log.context || {}),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    return csv;
  }
}

// 导出单例
export const errorClient = new ErrorClient();

export default errorClient;
