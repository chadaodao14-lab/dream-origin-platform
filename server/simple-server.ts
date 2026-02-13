import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
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
    uptime: process.uptime(),
    message: '梦之源创业投资平台 API 服务运行正常'
  });
});

// 简单的测试端点
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
app.listen(PORT, () => {
  logger.info(`🚀 服务器运行在端口 ${PORT}`);
  logger.info(`🎯 环境: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📊 健康检查: http://localhost:${PORT}/health`);
  logger.info(`🧪 测试端点: http://localhost:${PORT}/api/test`);
});

export default app;