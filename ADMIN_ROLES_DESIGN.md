# 多层级管理员体系架构设计

## 概述

本文档描述梦之源创业投资平台的多层级管理员体系设计。该体系通过角色和权限分离，实现精细化的访问控制和操作权限管理。

---

## 管理员角色体系

### 角色分类

| 角色代码 | 角色名称 | 权限级别 | 主要职责 | 数量限制 |
|---------|---------|--------|--------|--------|
| **SUPER_ADMIN** | 超级管理员 | 10 | 平台最高权限，系统配置、角色管理 | 1-3 |
| **FINANCE_ADMIN** | 财务管理员 | 8 | 资金管理、财务报表、收入分配 | 1-5 |
| **RISK_ADMIN** | 风控管理员 | 7 | 风险评估、异常监控、安全管理 | 1-3 |
| **AUDIT_ADMIN** | 审计管理员 | 6 | 操作审计、日志查看、合规检查 | 1-2 |
| **CONTENT_ADMIN** | 内容管理员 | 5 | 内容审核、公告发布、信息管理 | 1-3 |
| **USER_ADMIN** | 用户管理员 | 4 | 用户管理、账户维护、投诉处理 | 1-5 |

### 权限级别说明

- **级别 10（超级管理员）** - 拥有系统所有权限，可管理其他管理员
- **级别 8-9（高级管理员）** - 拥有特定领域的完全权限
- **级别 5-7（中级管理员）** - 拥有特定领域的部分权限
- **级别 1-4（初级管理员）** - 拥有有限的权限，需要审批

---

## 权限体系

### 权限分类

#### 1. 系统管理权限
- `system:config:read` - 查看系统配置
- `system:config:write` - 修改系统配置
- `system:role:manage` - 管理角色和权限
- `system:admin:manage` - 管理管理员账户
- `system:backup:execute` - 执行数据备份

#### 2. 财务管理权限
- `finance:fund:view` - 查看资金信息
- `finance:fund:transfer` - 执行资金转账
- `finance:commission:manage` - 管理佣金分配
- `finance:report:view` - 查看财务报表
- `finance:report:export` - 导出财务报表
- `finance:audit:trail` - 查看财务审计日志

#### 3. 风控管理权限
- `risk:monitor:view` - 查看风险监控
- `risk:alert:manage` - 管理风险告警
- `risk:user:block` - 冻结/解冻用户
- `risk:transaction:review` - 审查异常交易
- `risk:policy:manage` - 管理风控策略

#### 4. 审计管理权限
- `audit:log:view` - 查看审计日志
- `audit:log:export` - 导出审计日志
- `audit:report:generate` - 生成审计报告
- `audit:compliance:check` - 执行合规检查

#### 5. 内容管理权限
- `content:news:manage` - 管理新闻公告
- `content:banner:manage` - 管理横幅广告
- `content:help:manage` - 管理帮助文档
- `content:review:approve` - 审核内容

#### 6. 用户管理权限
- `user:account:view` - 查看用户账户
- `user:account:edit` - 编辑用户信息
- `user:account:disable` - 禁用用户账户
- `user:complaint:handle` - 处理用户投诉
- `user:kyc:verify` - 审核 KYC 信息

### 权限矩阵

| 权限 | 超级管理员 | 财务管理员 | 风控管理员 | 审计管理员 | 内容管理员 | 用户管理员 |
|-----|----------|---------|---------|---------|---------|---------|
| system:config:write | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| finance:fund:transfer | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| risk:user:block | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| audit:log:view | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| content:news:manage | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| user:account:disable | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |

---

## 数据库设计

### 表结构

#### 1. admin_roles 表
```sql
CREATE TABLE admin_roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  level INT NOT NULL,
  max_count INT DEFAULT 5,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 2. admin_permissions 表
```sql
CREATE TABLE admin_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. role_permissions 表
```sql
CREATE TABLE role_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_role_permission (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES admin_roles(id),
  FOREIGN KEY (permission_id) REFERENCES admin_permissions(id)
);
```

#### 4. user_admin_roles 表
```sql
CREATE TABLE user_admin_roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  assigned_by INT,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE KEY unique_user_role (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES admin_roles(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id)
);
```

#### 5. admin_audit_log 表
```sql
CREATE TABLE admin_audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id INT,
  details JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id),
  INDEX idx_admin_id (admin_id),
  INDEX idx_created_at (created_at)
);
```

---

## 权限检查机制

### 权限验证流程

```
1. 用户发起请求
   ↓
2. 检查用户是否为管理员
   ↓
3. 获取用户的所有角色
   ↓
4. 获取角色对应的权限
   ↓
5. 检查权限是否包含所需权限
   ↓
6. 允许/拒绝请求
   ↓
7. 记录审计日志
```

### 权限检查中间件

```typescript
// 伪代码
async function checkPermission(userId, requiredPermission) {
  // 1. 获取用户信息
  const user = await db.select().from(users).where(eq(users.id, userId));
  
  // 2. 检查是否为管理员
  if (user.role !== 'admin') {
    throw new ForbiddenError('Not an admin user');
  }
  
  // 3. 获取用户角色
  const userRoles = await db.select()
    .from(userAdminRoles)
    .where(eq(userAdminRoles.userId, userId));
  
  // 4. 获取所有权限
  const permissions = await db.select()
    .from(rolePermissions)
    .where(inArray(rolePermissions.roleId, userRoles.map(r => r.roleId)));
  
  // 5. 检查权限
  const hasPermission = permissions.some(p => p.permission.code === requiredPermission);
  
  if (!hasPermission) {
    throw new ForbiddenError('Insufficient permissions');
  }
  
  // 6. 记录审计日志
  await recordAuditLog(userId, 'ACCESS_GRANTED', requiredPermission);
  
  return true;
}
```

---

## 实现方案

### 后端实现

#### 1. 权限检查装饰器
```typescript
@RequirePermission('finance:fund:transfer')
async transferFunds(amount: number) {
  // 只有拥有此权限的管理员才能执行
}
```

#### 2. 中间件集成
```typescript
app.use(adminPermissionMiddleware);
```

#### 3. tRPC 过程保护
```typescript
protectedAdminProcedure
  .use(requirePermission('finance:fund:transfer'))
  .mutation(async ({ ctx, input }) => {
    // 执行转账操作
  })
```

### 前端实现

#### 1. 权限检查组件
```typescript
<PermissionGuard permission="finance:fund:transfer">
  <TransferButton />
</PermissionGuard>
```

#### 2. 菜单权限过滤
```typescript
const menuItems = adminMenus.filter(item => 
  hasPermission(item.requiredPermission)
);
```

---

## 初始化数据

### 预设角色

| 角色 | 权限数量 | 主要权限 |
|-----|--------|--------|
| 超级管理员 | 全部 | 所有系统权限 |
| 财务管理员 | 8 | 资金、佣金、报表 |
| 风控管理员 | 7 | 风险、监控、用户冻结 |
| 审计管理员 | 5 | 审计日志、合规检查 |
| 内容管理员 | 4 | 新闻、横幅、帮助文档 |
| 用户管理员 | 6 | 用户账户、投诉处理 |

### 初始化脚本

```bash
# 创建角色
node scripts/init-admin-roles.mjs

# 创建权限
node scripts/init-admin-permissions.mjs

# 分配权限给角色
node scripts/init-role-permissions.mjs

# 创建初始管理员
node scripts/init-admin-users.mjs
```

---

## 安全考虑

### 最小权限原则
- 每个管理员只分配必要的权限
- 定期审查和更新权限
- 及时撤销不需要的权限

### 权限过期机制
- 管理员权限可设置过期时间
- 过期后需要重新授予
- 防止权限长期持有

### 审计和监控
- 记录所有权限相关操作
- 监控异常权限使用
- 定期生成权限审计报告

### 权限冲突处理
- 不允许同时拥有冲突的权限
- 自动检测权限冲突
- 提示管理员进行调整

---

## 权限管理最佳实践

### 1. 权限分配
- 基于职位和职责分配权限
- 遵循最小权限原则
- 定期审查权限分配

### 2. 权限更新
- 权限变更需要审批
- 记录所有权限变更
- 通知相关管理员

### 3. 权限审计
- 定期审计权限使用
- 检查异常权限行为
- 生成审计报告

### 4. 权限文档
- 维护权限清单
- 记录权限变更历史
- 提供权限查询接口

---

## 后续扩展

### 1. 动态权限
- 支持自定义权限
- 支持权限组合
- 支持权限继承

### 2. 条件权限
- 基于时间的权限
- 基于地点的权限
- 基于操作金额的权限

### 3. 权限委托
- 允许权限临时委托
- 支持权限代理
- 记录委托信息

### 4. 权限分析
- 权限使用统计
- 权限冲突分析
- 权限优化建议

---

**版本**: 1.0.0  
**创建时间**: 2026-02-12  
**状态**: 设计完成，待实现
