# 全局错误处理和日志系统实现指南

## 概述

本文档介绍梦之源创业投资平台的全局错误处理和日志系统。该系统提供统一的错误管理、日志记录、性能监控和调试功能，覆盖后端和前端。

**系统特性**:
- 多级别日志记录（DEBUG、INFO、WARN、ERROR、FATAL）
- 9 种标准化错误类型
- 自动错误转换和格式化
- 性能指标监控
- 远程日志发送
- React 错误边界捕获
- 全局未处理错误捕获
- 日志导出功能（JSON、CSV）

---

## 后端错误处理系统

### 1. 日志服务 (`server/_core/logger.ts`)

#### 功能特性
- 多级别日志记录
- 内存日志存储（最多 1000 条）
- 日志统计分析
- 远程日志发送
- 时间戳和上下文记录

#### 使用示例

```typescript
import { logger, LogLevel } from "./server/_core/logger";

// 记录信息日志
logger.info("User logged in", { userId: "123", timestamp: new Date() });

// 记录错误日志
logger.error("Database connection failed", error, { retries: 3 });

// 记录性能指标
logger.performance("API request completed", 250, { endpoint: "/api/users" });

// 获取日志统计
const stats = logger.getStats();
console.log(`Info logs: ${stats.INFO}, Error logs: ${stats.ERROR}`);

// 获取最近的日志
const recentLogs = logger.getRecentLogs(50);

// 按级别过滤
const errorLogs = logger.filterByLevel(LogLevel.ERROR);
```

#### 日志级别

| 级别 | 用途 | 示例 |
|------|------|------|
| DEBUG | 开发调试信息 | 函数入参、变量值 |
| INFO | 一般信息 | 用户操作、系统事件 |
| WARN | 警告信息 | 性能下降、资源不足 |
| ERROR | 错误信息 | 异常、失败操作 |
| FATAL | 严重错误 | 系统崩溃、数据丢失 |

### 2. 自定义错误类 (`server/_core/errors.ts`)

#### 错误类型

| 错误类 | 状态码 | 用途 |
|--------|--------|------|
| `AuthError` | 401 | 认证失败 |
| `ForbiddenError` | 403 | 权限不足 |
| `ValidationError` | 400 | 数据验证失败 |
| `NotFoundError` | 404 | 资源不存在 |
| `ConflictError` | 409 | 资源冲突 |
| `BusinessError` | 400 | 业务逻辑错误 |
| `DatabaseError` | 500 | 数据库错误 |
| `ServiceError` | 500 | 服务错误 |
| `AppError` | 500 | 通用应用错误 |

#### 使用示例

```typescript
import { 
  ValidationError, 
  AuthError, 
  NotFoundError,
  BusinessError 
} from "./server/_core/errors";

// 验证错误
throw new ValidationError("Email format invalid", { field: "email" });

// 认证错误
throw new AuthError("Invalid credentials");

// 未找到错误
throw new NotFoundError("User");

// 业务逻辑错误
throw new BusinessError("Insufficient balance", { required: 1000, available: 500 });

// 获取错误上下文
const error = new ValidationError("Invalid input");
const context = error.toContext();
console.log(context);
// {
//   code: "VALIDATION_ERROR",
//   statusCode: 400,
//   message: "Invalid input",
//   timestamp: "2026-02-12T16:40:00.000Z",
//   ...
// }
```

### 3. 错误处理中间件 (`server/_core/errorHandler.ts`)

#### 核心函数

**`handleError(error, context)`** - 处理错误并返回标准化响应

```typescript
import { handleError } from "./server/_core/errorHandler";

try {
  // 业务逻辑
} catch (error) {
  const { error: appError, trpcError } = handleError(error, {
    operation: "getUserById",
    userId: "user-123",
    requestId: "req-456"
  });
  
  throw trpcError; // 抛出给 tRPC
}
```

**`asyncHandler(fn, operation)`** - 异步函数包装器

```typescript
import { asyncHandler } from "./server/_core/errorHandler";

const getUserData = asyncHandler(async (userId: string) => {
  const user = await db.select().from(users).where(eq(users.id, userId));
  if (!user) throw new NotFoundError("User");
  return user;
}, "getUserData");

// 使用
const user = await getUserData("123");
```

**`createErrorResponse(error)`** - 创建标准错误响应

```typescript
import { createErrorResponse } from "./server/_core/errorHandler";

const error = new ValidationError("Invalid input");
const response = createErrorResponse(error);
// {
//   success: false,
//   error: {
//     code: "VALIDATION_ERROR",
//     message: "Invalid input",
//     timestamp: "...",
//     ...
//   }
// }
```

### 4. tRPC 错误处理中间件 (`server/_core/trpcErrorMiddleware.ts`)

#### 功能

- 自动请求日志记录
- 性能指标监控
- 错误转换和处理
- 请求追踪

#### 使用示例

```typescript
import { withErrorHandling, withMutationLogging } from "./server/_core/trpcErrorMiddleware";

// 在 tRPC 过程中使用
export const userRouter = router({
  getUser: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(withErrorHandling(async ({ input }) => {
      const user = await db.select().from(users).where(eq(users.id, input.id));
      if (!user) throw new NotFoundError("User");
      return user;
    }, "getUser")),

  updateUser: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string() }))
    .mutation(withMutationLogging(async ({ input }) => {
      const result = await db.update(users)
        .set({ name: input.name })
        .where(eq(users.id, input.id));
      return result;
    }, "updateUser")),
});
```

---

## 前端错误处理系统

### 1. 错误边界组件 (`client/src/components/ErrorBoundary.tsx`)

#### 功能

- 捕获 React 组件错误
- 显示友好的错误界面
- 重试和重新加载选项
- 错误报告到服务器

#### 使用示例

```typescript
import ErrorBoundary from "@/components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary 
      onError={(error, errorInfo) => {
        console.log("Error caught:", error, errorInfo);
      }}
    >
      <YourApp />
    </ErrorBoundary>
  );
}
```

#### 功能特性

- **自动错误捕获** - 捕获子组件中的所有 React 错误
- **重试机制** - 用户可重试失败的操作
- **错误计数** - 追踪错误发生次数
- **远程报告** - 自动发送错误到服务器
- **开发模式** - 显示详细的错误堆栈

### 2. 错误客户端 (`client/src/lib/errorClient.ts`)

#### 功能

- 全局错误捕获
- 日志管理
- 日志导出
- 错误统计

#### 使用示例

```typescript
import { errorClient } from "@/lib/errorClient";

// 手动记录日志
errorClient.info("User action", { action: "login" });
errorClient.error("API call failed", error, { endpoint: "/api/users" });

// 获取日志
const logs = errorClient.getLogs();
const recentLogs = errorClient.getRecentLogs(50);

// 按级别过滤
const errorLogs = errorClient.filterByLevel(ClientLogLevel.ERROR);

// 获取统计
const stats = errorClient.getStats();

// 导出日志
const jsonLogs = errorClient.exportAsJSON();
const csvLogs = errorClient.exportAsCSV();

// 发送到服务器
await errorClient.sendToServer();

// 添加日志监听器
const unsubscribe = errorClient.addListener((log) => {
  console.log("New log:", log);
});
```

#### 全局错误捕获

错误客户端自动捕获以下错误：

```typescript
// 1. 未捕获的错误
window.addEventListener("error", (event) => {
  // 自动记录
});

// 2. 未处理的 Promise 拒绝
window.addEventListener("unhandledrejection", (event) => {
  // 自动记录
});
```

---

## 最佳实践

### 后端

#### 1. 使用适当的错误类型

```typescript
// ✅ 好的做法
if (!user) throw new NotFoundError("User");
if (!hasPermission) throw new ForbiddenError("Insufficient permissions");
if (balance < amount) throw new BusinessError("Insufficient balance");

// ❌ 避免
throw new Error("User not found");
throw new Error("Permission denied");
```

#### 2. 记录关键操作

```typescript
// ✅ 好的做法
logger.info("User deposit confirmed", { 
  userId, 
  amount, 
  transactionId 
});

// ❌ 避免
console.log("Deposit confirmed");
```

#### 3. 包含上下文信息

```typescript
// ✅ 好的做法
throw new ValidationError("Invalid email", { 
  field: "email", 
  value: email,
  pattern: "email@example.com"
});

// ❌ 避免
throw new ValidationError("Invalid email");
```

### 前端

#### 1. 使用错误边界包装关键组件

```typescript
// ✅ 好的做法
<ErrorBoundary>
  <Dashboard />
</ErrorBoundary>

// ❌ 避免
<Dashboard />
```

#### 2. 记录用户操作

```typescript
// ✅ 好的做法
async function handleSubmit(data) {
  try {
    errorClient.info("Form submitted", { formId: "user-form" });
    const result = await submitForm(data);
    errorClient.info("Form submitted successfully", { result });
  } catch (error) {
    errorClient.error("Form submission failed", error, { formId: "user-form" });
  }
}

// ❌ 避免
async function handleSubmit(data) {
  return submitForm(data);
}
```

#### 3. 处理异步错误

```typescript
// ✅ 好的做法
useEffect(() => {
  const unsubscribe = errorClient.addListener((log) => {
    if (log.level === ClientLogLevel.ERROR) {
      showNotification({
        type: "error",
        message: "An error occurred. Please try again."
      });
    }
  });

  return unsubscribe;
}, []);

// ❌ 避免
// 不处理全局错误
```

---

## 错误处理流程

### 后端流程

```
1. 业务逻辑执行
   ↓
2. 错误发生 → 抛出特定错误类型
   ↓
3. tRPC 中间件捕获
   ↓
4. 记录错误日志
   ↓
5. 转换为 TRPCError
   ↓
6. 返回给客户端
```

### 前端流程

```
1. 用户操作/API 调用
   ↓
2. 错误发生
   ↓
3. 全局错误处理器捕获
   ↓
4. 记录到 errorClient
   ↓
5. 显示错误提示
   ↓
6. 可选：发送到服务器
```

---

## 性能考虑

### 日志存储

- 内存中最多保存 1000 条日志
- 超过限制时自动删除最旧的日志
- 定期清理可以手动调用 `logger.clear()`

### 远程发送

- 异步发送，不阻塞主线程
- 失败时静默处理，不影响应用
- 建议定期发送而不是每条日志都发送

### 性能监控

```typescript
// 记录操作耗时
const startTime = Date.now();
// ... 执行操作 ...
const duration = Date.now() - startTime;
logger.performance("Operation completed", duration, { operation: "query" });
```

---

## 调试技巧

### 查看日志

```typescript
// 在浏览器控制台
errorClient.getLogs().forEach(log => console.log(log));

// 导出日志
const logs = errorClient.exportAsJSON();
console.log(logs);
```

### 发送日志到服务器

```typescript
// 手动发送
await errorClient.sendToServer();

// 发送特定日志
const errorLogs = errorClient.filterByLevel(ClientLogLevel.ERROR);
await errorClient.sendToServer(errorLogs);
```

### 开发模式调试

```typescript
// 在开发环境启用详细日志
if (process.env.NODE_ENV === "development") {
  logger.debug("Detailed debug information", { ...data });
}
```

---

## 常见问题

### Q: 如何区分不同类型的错误？
A: 使用 `error.code` 属性来识别错误类型。每个错误类都有唯一的 `ErrorCode`。

### Q: 日志会占用多少内存？
A: 每条日志约 200-500 字节，1000 条日志约 200-500 KB。

### Q: 如何禁用远程日志发送？
A: 在初始化时设置 `enableRemote: false`。

### Q: 前端错误是否会自动发送到后端？
A: 是的，ErrorBoundary 会自动使用 `navigator.sendBeacon()` 发送错误。

---

## 总结

全局错误处理和日志系统提供了完整的错误管理解决方案，涵盖：

- **后端**: 日志记录、错误转换、性能监控
- **前端**: 错误捕获、日志管理、用户提示
- **集成**: 统一的错误处理流程和标准化响应格式

通过遵循本指南的最佳实践，可以构建更加稳定、可维护的应用系统。

---

**测试覆盖**: 91 个测试通过（包括 31 个错误处理测试）  
**最后更新**: 2026-02-12  
**版本**: 1.0.0
