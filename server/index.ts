import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { appRouter } from '../routers';
import { createContext } from './trpc';
import { systemMonitor } from '../system.monitor';
import { redisCache } from '../cache.redis';
import { logger } from '../logger';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// 中间件
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'development' 
    ? [`http://localhost:${process.env.CLIENT_PORT || 3000}`] 
    : [],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API路由
app.use('/api/trpc', createContext, appRouter);

// 静态文件服务（生产环境）
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist/client'));
  app.get('*', (req, res) => {
    res.sendFile('dist/client/index.html', { root: '.' });
  });
}

// 错误处理中间件
app.use((err: any, req: any, res: any, next: any) => {
  logger.error('Unhandled error', err);
  res.status(500).json({
    error: {
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message,
      code: 'INTERNAL_ERROR'
    }
  });
});

// 启动服务器
async function startServer() {
  try {
    // 连接Redis缓存
    await redisCache.connect();
    logger.info('Redis cache connected');

    // 启动系统监控
    systemMonitor.startMonitoring(30000);
    logger.info('System monitoring started');

    // 启动HTTP服务器
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`🎯 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await systemMonitor.stopMonitoring();
  await redisCache.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await systemMonitor.stopMonitoring();
  await redisCache.disconnect();
  process.exit(0);
});

// 启动应用
startServer().catch(console.error);

export default app;