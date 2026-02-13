import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8002;

// 中间件
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'development' 
    ? [`http://localhost:${process.env.CLIENT_PORT || 3000}`, `http://localhost:3001`] 
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
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 模拟的用户数据端点
app.get('/api/users', (req, res) => {
  res.json({
    users: [
      { id: 1, name: '管理员', role: 'admin', isActivated: true },
      { id: 2, name: '普通用户', role: 'user', isActivated: false }
    ],
    total: 2
  });
});

// 模拟的入金数据端点
app.get('/api/deposits', (req, res) => {
  res.json({
    deposits: [
      { id: 1, userId: 1, amount: 1000, status: 'confirmed', createdAt: new Date() },
      { id: 2, userId: 2, amount: 500, status: 'pending', createdAt: new Date() }
    ],
    total: 2
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`🎯 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/health`);
  console.log(`🧪 测试端点: http://localhost:${PORT}/api/test`);
  console.log(`👥 用户数据: http://localhost:${PORT}/api/users`);
  console.log(`💰 入金数据: http://localhost:${PORT}/api/deposits`);
});

export default app;