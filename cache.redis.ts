/**
 * Redis缓存集成
 * 提供高性能的数据缓存功能
 */

import { createClient, RedisClientType } from 'redis';
import { logger } from "./logger";

/**
 * 缓存配置接口
 */
export interface CacheConfig {
  /** Redis连接URL */
  url: string;
  /** 默认过期时间（秒） */
  defaultTTL: number;
  /** 最大缓存大小 */
  maxSize: number;
  /** 是否启用缓存 */
  enabled: boolean;
  /** 缓存前缀 */
  prefix: string;
}

/**
 * 缓存统计信息
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  currentSize: number;
  maxSize: number;
  evictions: number;
}

/**
 * Redis缓存管理器
 */
export class RedisCacheManager {
  private static instance: RedisCacheManager;
  private client: RedisClientType | null = null;
  private config: CacheConfig;
  private isConnected = false;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    currentSize: 0,
    maxSize: 0,
    evictions: 0
  };

  private constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      defaultTTL: 300, // 5分钟
      maxSize: 10000,
      enabled: true,
      prefix: 'dreamsource:',
      ...config
    };
    
    this.stats.maxSize = this.config.maxSize;
  }

  /**
   * 获取单例实例
   */
  public static getInstance(config?: Partial<CacheConfig>): RedisCacheManager {
    if (!RedisCacheManager.instance) {
      RedisCacheManager.instance = new RedisCacheManager(config);
    }
    return RedisCacheManager.instance;
  }

  /**
   * 连接到Redis
   */
  public async connect(): Promise<boolean> {
    if (!this.config.enabled) {
      logger.info("Redis cache is disabled");
      return false;
    }

    try {
      this.client = createClient({
        url: this.config.url,
        socket: {
          reconnectStrategy: (retries: number) => {
            if (retries > 10) {
              logger.error("Redis reconnection attempts exhausted");
              return false;
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
      });

      await this.client.connect();
      return true;
    } catch (error) {
      logger.error('Failed to connect to Redis', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * 断开Redis连接
   */
  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis client disconnected');
    }
  }

  /**
   * 检查是否已连接
   */
  public isConnectedToRedis(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * 生成带前缀的缓存键
   */
  private generateKey(key: string): string {
    return `${this.config.prefix}${key}`;
  }

  /**
   * 设置缓存值
   */
  public async set<T>(
    key: string,
    value: T,
    ttl: number = this.config.defaultTTL
  ): Promise<boolean> {
    if (!this.config.enabled || !this.isConnectedToRedis()) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(key);
      const serializedValue = JSON.stringify(value);
      
      await this.client!.setEx(cacheKey, ttl, serializedValue);
      
      // 更新统计
      this.stats.currentSize = await this.getCurrentSize();
      
      logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      logger.error(`Failed to set cache key: ${key}`, error);
      return false;
    }
  }

  /**
   * 获取缓存值
   */
  public async get<T>(key: string): Promise<T | null> {
    if (!this.config.enabled || !this.isConnectedToRedis()) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    try {
      const cacheKey = this.generateKey(key);
      const cachedValue = await this.client!.get(cacheKey);
      
      if (cachedValue !== null) {
        this.stats.hits++;
        this.updateHitRate();
        logger.debug(`Cache HIT: ${key}`);
        return JSON.parse(cachedValue) as T;
      } else {
        this.stats.misses++;
        this.updateHitRate();
        logger.debug(`Cache MISS: ${key}`);
        return null;
      }
    } catch (error) {
      logger.error(`Failed to get cache key: ${key}`, error);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  /**
   * 删除缓存值
   */
  public async delete(key: string): Promise<boolean> {
    if (!this.config.enabled || !this.isConnectedToRedis()) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(key);
      await this.client!.del(cacheKey);
      
      // 更新统计
      this.stats.currentSize = await this.getCurrentSize();
      
      logger.debug(`Cache DELETE: ${key}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete cache key: ${key}`, error);
      return false;
    }
  }

  /**
   * 批量删除缓存（按模式）
   */
  public async deleteByPattern(pattern: string): Promise<number> {
    if (!this.config.enabled || !this.isConnectedToRedis()) {
      return 0;
    }

    try {
      const cachePattern = this.generateKey(pattern);
      const keys = await this.client!.keys(cachePattern);
      
      if (keys.length > 0) {
        await this.client!.del(keys);
        logger.info(`Deleted ${keys.length} cache entries matching pattern: ${pattern}`);
        
        // 更新统计
        this.stats.currentSize = await this.getCurrentSize();
        return keys.length;
      }
      
      return 0;
    } catch (error) {
      logger.error(`Failed to delete cache by pattern: ${pattern}`, error);
      return 0;
    }
  }

  /**
   * 清空所有缓存
   */
  public async flushAll(): Promise<boolean> {
    if (!this.config.enabled || !this.isConnectedToRedis()) {
      return false;
    }

    try {
      await this.client!.flushAll();
      this.stats.currentSize = 0;
      logger.info('Cache flushed completely');
      return true;
    } catch (error) {
      logger.error('Failed to flush cache', error);
      return false;
    }
  }

  /**
   * 获取缓存统计信息
   */
  public getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * 更新命中率
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * 获取当前缓存大小
   */
  private async getCurrentSize(): Promise<number> {
    if (!this.isConnectedToRedis()) {
      return 0;
    }

    try {
      const pattern = this.generateKey('*');
      const keys = await this.client!.keys(pattern);
      return keys.length;
    } catch (error) {
      logger.error('Failed to get cache size', error);
      return 0;
    }
  }

  /**
   * 缓存装饰器 - 为函数添加缓存功能
   */
  public withCache<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    keyGenerator: (...args: Parameters<T>) => string,
    ttl?: number
  ): T {
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      const cacheKey = keyGenerator(...args);
      
      // 尝试从缓存获取
      const cachedResult = await this.get<ReturnType<T>>(cacheKey);
      if (cachedResult !== null) {
        return cachedResult;
      }
      
      // 执行原始函数
      const result = await fn(...args);
      
      // 缓存结果
      await this.set(cacheKey, result, ttl);
      
      return result;
    }) as T;
  }

  /**
   * 缓存特定类型的常用查询
   */
  public createCachedQuery<T>(
    queryFn: () => Promise<T>,
    cacheKey: string,
    ttl?: number
  ): () => Promise<T> {
    return this.withCache(
      queryFn,
      () => cacheKey,
      ttl
    );
  }

  /**
   * 缓存用户相关数据
   */
  public async cacheUserData<T>(
    userId: number,
    data: T,
    ttl?: number
  ): Promise<boolean> {
    return await this.set(`user:${userId}`, data, ttl);
  }

  /**
   * 获取用户缓存数据
   */
  public async getUserData<T>(userId: number): Promise<T | null> {
    return await this.get<T>(`user:${userId}`);
  }

  /**
   * 缓存统计查询结果
   */
  public async cacheStatistics<T>(
    statType: string,
    data: T,
    ttl?: number
  ): Promise<boolean> {
    return await this.set(`stat:${statType}`, data, ttl);
  }

  /**
   * 获取统计缓存数据
   */
  public async getStatistics<T>(statType: string): Promise<T | null> {
    return await this.get<T>(`stat:${statType}`);
  }

  /**
   * 缓存配置数据
   */
  public async cacheConfig<T>(
    configKey: string,
    data: T,
    ttl?: number
  ): Promise<boolean> {
    return await this.set(`config:${configKey}`, data, ttl);
  }

  /**
   * 获取配置缓存数据
   */
  public async getConfig<T>(configKey: string): Promise<T | null> {
    return await this.get<T>(`config:${configKey}`);
  }
}

// 导出默认实例
export const redisCache = RedisCacheManager.getInstance();