/**
 * 系统监控和告警机制
 * 提供实时系统健康监控、性能指标收集和告警通知
 */

import { logger, LogLevel } from "./logger";
import { globalErrorHandler } from "./errorHandling.integration";
import { dbOptimizer } from "./database.optimizer";
import { redisCache } from "./cache.redis";

/**
 * 系统指标接口
 */
export interface SystemMetrics {
  /** CPU使用率 (%) */
  cpuUsage: number;
  /** 内存使用率 (%) */
  memoryUsage: number;
  /** 磁盘使用率 (%) */
  diskUsage: number;
  /** 网络IO */
  networkIO: {
    received: number;
    transmitted: number;
  };
  /** 数据库连接状态 */
  database: {
    connected: boolean;
    activeConnections: number;
    slowQueries: number;
  };
  /** 缓存状态 */
  cache: {
    connected: boolean;
    hitRate: number;
    currentSize: number;
  };
  /** 应用性能指标 */
  application: {
    uptime: number;
    requestCount: number;
    errorRate: number;
    avgResponseTime: number;
    activeUsers: number;
  };
}

/**
 * 告警规则接口
 */
export interface AlertRule {
  /** 规则名称 */
  name: string;
  /** 监控指标 */
  metric: keyof SystemMetrics | string;
  /** 阈值 */
  threshold: number;
  /** 比较操作符 */
  operator: '>' | '<' | '>=' | '<=' | '===';
  /** 告警级别 */
  severity: 'info' | 'warning' | 'error' | 'critical';
  /** 是否启用 */
  enabled: boolean;
  /** 通知渠道 */
  channels: AlertChannel[];
}

/**
 * 告警渠道类型
 */
export type AlertChannel = 'email' | 'sms' | 'webhook' | 'slack' | 'dingtalk';

/**
 * 告警通知接口
 */
export interface AlertNotification {
  /** 告警ID */
  id: string;
  /** 规则名称 */
  ruleName: string;
  /** 告警级别 */
  severity: string;
  /** 告警消息 */
  message: string;
  /** 触发时间 */
  timestamp: Date;
  /** 当前值 */
  currentValue: number;
  /** 阈值 */
  threshold: number;
  /** 通知渠道 */
  channels: AlertChannel[];
}

/**
 * 系统监控器
 */
export class SystemMonitor {
  private static instance: SystemMonitor;
  private metrics: SystemMetrics;
  private alertRules: AlertRule[] = [];
  private alertHistory: AlertNotification[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private requestCounter = 0;
  private errorCounter = 0;
  private responseTimes: number[] = [];

  private constructor() {
    this.metrics = this.getDefaultMetrics();
    this.initializeAlertRules();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): SystemMonitor {
    if (!SystemMonitor.instance) {
      SystemMonitor.instance = new SystemMonitor();
    }
    return SystemMonitor.instance;
  }

  /**
   * 获取默认指标值
   */
  private getDefaultMetrics(): SystemMetrics {
    return {
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      networkIO: { received: 0, transmitted: 0 },
      database: { connected: false, activeConnections: 0, slowQueries: 0 },
      cache: { connected: false, hitRate: 0, currentSize: 0 },
      application: {
        uptime: 0,
        requestCount: 0,
        errorRate: 0,
        avgResponseTime: 0,
        activeUsers: 0
      }
    };
  }

  /**
   * 初始化默认告警规则
   */
  private initializeAlertRules(): void {
    this.alertRules = [
      {
        name: 'High CPU Usage',
        metric: 'cpuUsage',
        threshold: 80,
        operator: '>',
        severity: 'warning',
        enabled: true,
        channels: ['email', 'slack']
      },
      {
        name: 'High Memory Usage',
        metric: 'memoryUsage',
        threshold: 85,
        operator: '>',
        severity: 'warning',
        enabled: true,
        channels: ['email', 'sms']
      },
      {
        name: 'Database Connection Lost',
        metric: 'database.connected',
        threshold: 0,
        operator: '===',
        severity: 'critical',
        enabled: true,
        channels: ['email', 'sms', 'webhook']
      },
      {
        name: 'Low Cache Hit Rate',
        metric: 'cache.hitRate',
        threshold: 0.7,
        operator: '<',
        severity: 'warning',
        enabled: true,
        channels: ['email']
      },
      {
        name: 'High Error Rate',
        metric: 'application.errorRate',
        threshold: 0.05,
        operator: '>',
        severity: 'error',
        enabled: true,
        channels: ['email', 'slack']
      },
      {
        name: 'Slow Response Time',
        metric: 'application.avgResponseTime',
        threshold: 2000,
        operator: '>',
        severity: 'warning',
        enabled: true,
        channels: ['email']
      }
    ];
  }

  /**
   * 开始监控
   */
  public startMonitoring(intervalMs: number = 30000): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkAlerts();
    }, intervalMs);

    logger.info(`System monitoring started with ${intervalMs}ms interval`);
  }

  /**
   * 停止监控
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('System monitoring stopped');
    }
  }

  /**
   * 收集系统指标
   */
  private async collectMetrics(): Promise<void> {
    try {
      // 收集CPU和内存使用率
      this.metrics.cpuUsage = this.getCpuUsage();
      this.metrics.memoryUsage = this.getMemoryUsage();
      
      // 收集磁盘使用率
      this.metrics.diskUsage = this.getDiskUsage();
      
      // 收集网络IO
      this.metrics.networkIO = this.getNetworkIO();
      
      // 收集数据库指标
      const dbStats = await dbOptimizer.getPerformanceStats();
      this.metrics.database = {
        connected: true,
        activeConnections: dbStats.connectionStats.activeConnections,
        slowQueries: dbStats.queryStats.slowQueries
      };
      
      // 收集缓存指标
      const cacheStats = redisCache.getStats();
      this.metrics.cache = {
        connected: redisCache.isConnectedToRedis(),
        hitRate: cacheStats.hitRate,
        currentSize: cacheStats.currentSize
      };
      
      // 收集应用指标
      const appStats = globalErrorHandler.getHealthStatus();
      this.metrics.application = {
        uptime: process.uptime(),
        requestCount: this.requestCounter,
        errorRate: this.requestCounter > 0 ? this.errorCounter / this.requestCounter : 0,
        avgResponseTime: this.getAverageResponseTime(),
        activeUsers: this.getActiveUserCount()
      };
      
      logger.debug('System metrics collected', this.metrics);
      
    } catch (error) {
      logger.error('Failed to collect system metrics', error);
    }
  }

  /**
   * 检查告警规则
   */
  private checkAlerts(): void {
    const currentTime = new Date();
    
    for (const rule of this.alertRules.filter(r => r.enabled)) {
      const currentValue = this.getMetricValue(rule.metric);
      
      if (currentValue !== undefined && this.evaluateCondition(currentValue, rule.operator, rule.threshold)) {
        const alert: AlertNotification = {
          id: this.generateAlertId(),
          ruleName: rule.name,
          severity: rule.severity,
          message: `${rule.name}: ${currentValue} ${rule.operator} ${rule.threshold}`,
          timestamp: currentTime,
          currentValue,
          threshold: rule.threshold,
          channels: rule.channels
        };
        
        this.triggerAlert(alert);
      }
    }
  }

  /**
   * 触发告警
   */
  private triggerAlert(alert: AlertNotification): void {
    // 检查是否为重复告警（去重）
    const recentAlert = this.alertHistory.find(
      a => a.ruleName === alert.ruleName && 
           a.timestamp.getTime() > Date.now() - 300000 // 5分钟内相同告警只触发一次
    );
    
    if (recentAlert) {
      logger.debug(`Duplicate alert suppressed: ${alert.ruleName}`);
      return;
    }
    
    // 记录告警
    this.alertHistory.push(alert);
    
    // 保持告警历史在合理范围内
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-500);
    }
    
    // 发送通知
    this.sendNotifications(alert);
    
    // 记录日志
    const logLevel = this.getLogLevelForSeverity(alert.severity);
    (logger as any)[logLevel](`ALERT: ${alert.message}`, alert);
  }

  /**
   * 发送通知
   */
  private async sendNotifications(alert: AlertNotification): Promise<void> {
    for (const channel of alert.channels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmailAlert(alert);
            break;
          case 'sms':
            await this.sendSmsAlert(alert);
            break;
          case 'webhook':
            await this.sendWebhookAlert(alert);
            break;
          case 'slack':
            await this.sendSlackAlert(alert);
            break;
          case 'dingtalk':
            await this.sendDingTalkAlert(alert);
            break;
        }
      } catch (error) {
        logger.error(`Failed to send ${channel} alert`, error);
      }
    }
  }

  /**
   * 记录请求
   */
  public recordRequest(duration: number, hasError: boolean = false): void {
    this.requestCounter++;
    this.responseTimes.push(duration);
    
    if (hasError) {
      this.errorCounter++;
    }
    
    // 保持响应时间数组在合理范围内
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-500);
    }
  }

  /**
   * 获取系统指标
   */
  public getMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  /**
   * 获取告警历史
   */
  public getAlertHistory(limit: number = 50): AlertNotification[] {
    return this.alertHistory.slice(-limit);
  }

  /**
   * 获取系统健康状态报告
   */
  public async getHealthReport(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: SystemMetrics;
    alerts: AlertNotification[];
    recommendations: string[];
  }> {
    await this.collectMetrics();
    
    const healthStatus = this.calculateOverallHealth();
    const recommendations = this.generateRecommendations();
    
    return {
      status: healthStatus,
      metrics: this.getMetrics(),
      alerts: this.getAlertHistory(10),
      recommendations
    };
  }

  // === 私有辅助方法 ===

  private getCpuUsage(): number {
    // 模拟CPU使用率，在实际应用中应使用系统监控库
    return Math.random() * 100;
  }

  private getMemoryUsage(): number {
    const used = process.memoryUsage().heapUsed;
    const total = process.memoryUsage().heapTotal;
    return (used / total) * 100;
  }

  private getDiskUsage(): number {
    // 模拟磁盘使用率
    return Math.random() * 100;
  }

  private getNetworkIO(): { received: number; transmitted: number } {
    // 模拟网络IO
    return {
      received: Math.random() * 1000,
      transmitted: Math.random() * 1000
    };
  }

  private getMetricValue(metricPath: string): number | undefined {
    const parts = metricPath.split('.');
    let current: any = this.metrics;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    
    return typeof current === 'number' ? current : undefined;
  }

  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      case '===': return value === threshold;
      default: return false;
    }
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getAverageResponseTime(): number {
    if (this.responseTimes.length === 0) return 0;
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    return sum / this.responseTimes.length;
  }

  private getActiveUserCount(): number {
    // 模拟活跃用户数
    return Math.floor(Math.random() * 100);
  }

  private calculateOverallHealth(): 'healthy' | 'degraded' | 'unhealthy' {
    const criticalAlerts = this.alertHistory.filter(a => 
      a.severity === 'critical' && a.timestamp.getTime() > Date.now() - 3600000
    ).length;
    
    const errorAlerts = this.alertHistory.filter(a => 
      (a.severity === 'error' || a.severity === 'warning') && 
      a.timestamp.getTime() > Date.now() - 3600000
    ).length;
    
    if (criticalAlerts > 0) return 'unhealthy';
    if (errorAlerts > 5) return 'degraded';
    return 'healthy';
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metrics.cpuUsage > 80) {
      recommendations.push('Consider scaling up CPU resources or optimizing CPU-intensive operations');
    }
    
    if (this.metrics.memoryUsage > 85) {
      recommendations.push('Memory usage is high, consider increasing memory allocation or optimizing memory usage');
    }
    
    if (this.metrics.database.slowQueries > 10) {
      recommendations.push('High number of slow queries detected, review database indexes and query optimization');
    }
    
    if (this.metrics.cache.hitRate < 0.7) {
      recommendations.push('Cache hit rate is low, consider adjusting cache strategy or TTL settings');
    }
    
    if (this.metrics.application.errorRate > 0.05) {
      recommendations.push('Error rate is high, investigate application logs for recurring issues');
    }
    
    return recommendations;
  }

  private getLogLevelForSeverity(severity: string): keyof typeof logger {
    switch (severity) {
      case 'info': return 'info';
      case 'warning': return 'warn';
      case 'error': return 'error';
      case 'critical': return 'fatal';
      default: return 'error';
    }
  }

  // 模拟通知发送方法
  private async sendEmailAlert(alert: AlertNotification): Promise<void> {
    logger.info(`Sending email alert: ${alert.message}`);
    // 实际实现应集成邮件服务
  }

  private async sendSmsAlert(alert: AlertNotification): Promise<void> {
    logger.info(`Sending SMS alert: ${alert.message}`);
    // 实际实现应集成短信服务
  }

  private async sendWebhookAlert(alert: AlertNotification): Promise<void> {
    logger.info(`Sending webhook alert: ${alert.message}`);
    // 实际实现应发送HTTP POST请求
  }

  private async sendSlackAlert(alert: AlertNotification): Promise<void> {
    logger.info(`Sending Slack alert: ${alert.message}`);
    // 实际实现应集成Slack API
  }

  private async sendDingTalkAlert(alert: AlertNotification): Promise<void> {
    logger.info(`Sending DingTalk alert: ${alert.message}`);
    // 实际实现应集成钉钉机器人API
  }
}

// 导出默认实例
export const systemMonitor = SystemMonitor.getInstance();