import { initTRPC } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { logger } from '../logger';

// 创建上下文类型
export interface Context {
  user?: {
    id: number;
    role: string;
    name: string;
  };
  req: CreateExpressContextOptions['req'];
  res: CreateExpressContextOptions['res'];
}

// 初始化 tRPC
const t = initTRPC.context<Context>().create();

// 中间件
export const middleware = t.middleware;
export const router = t.router;
export const publicProcedure = t.procedure;

// 认证中间件
const isAuthenticated = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new Error('UNAUTHORIZED');
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// 权限中间件
const isAdmin = middleware(async ({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== 'admin') {
    throw new Error('FORBIDDEN');
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// 导出受保护的过程
export const protectedProcedure = publicProcedure.use(isAuthenticated);
export const adminProcedure = publicProcedure.use(isAdmin);

// 创建上下文函数
export async function createContext(opts: CreateExpressContextOptions): Promise<Context> {
  const { req, res } = opts;
  
  // 记录请求
  logger.debug('Incoming request', {
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
  });

  // 这里应该实现实际的认证逻辑
  // 暂时返回模拟的用户数据
  const user = {
    id: 1,
    role: 'admin',
    name: 'Admin User'
  };

  return {
    user,
    req,
    res,
  };
}