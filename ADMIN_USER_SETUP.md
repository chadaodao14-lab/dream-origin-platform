# 初始顶级账户设置指南

## 概述

本文档说明梦之源创业投资平台的初始顶级账户（一号用户）设置。该账户具有最高权限，用于平台管理和初始资金配置。

---

## 一号用户信息

| 字段 | 值 |
|------|-----|
| **用户 ID** | 1 |
| **OpenID** | admin-001 |
| **用户名** | Administrator |
| **邮箱** | admin@dreamsource.com |
| **角色** | admin |
| **邀请码** | ADMIN001 |
| **激活状态** | 已激活 |
| **初始余额** | ¥1,000,000.00 |

---

## 账户权限

作为 admin 角色，一号用户拥有以下权限：

### 系统管理权限
- 用户管理：查看、编辑、禁用用户账户
- 资金管理：查看所有资金流动、调整用户余额
- 提现审核：审批用户提现申请
- 报告查看：访问所有系统报告和数据

### 平台管理权限
- 配置管理：修改平台配置和参数
- 审计日志：查看系统操作日志
- 告警管理：配置和管理系统告警
- 数据导出：导出平台数据用于分析

### 财务管理权限
- 资金池监控：实时查看资金池状态
- 收入统计：查看平台收入统计
- 佣金管理：管理佣金分配规则
- 财务报表：生成和查看财务报表

---

## 初始化方式

### 方式 1：使用 SQL 脚本

```bash
# 查看 SQL 脚本
cat scripts/init-admin-user.sql

# 在数据库中执行
mysql -u root -p database_name < scripts/init-admin-user.sql
```

### 方式 2：使用 Node.js 脚本

```bash
# 运行初始化脚本
node scripts/init-admin-user.mjs
```

脚本会自动：
1. 检查是否已存在管理员用户
2. 创建一号用户账户
3. 创建初始资产记录
4. 验证创建结果

### 方式 3：手动数据库操作

```sql
-- 创建一号用户
INSERT INTO users (
  openId, name, email, loginMethod, role, 
  invite_code, invite_path, direct_count, 
  is_activated, createdAt, updatedAt, lastSignedIn
) VALUES (
  'admin-001', 'Administrator', 'admin@dreamsource.com', 
  'admin', 'admin', 'ADMIN001', '1', 0, 1, 
  NOW(), NOW(), NOW()
);

-- 创建初始资产
INSERT INTO assets (
  user_id, available_balance, frozen_balance, 
  total_commission, monthly_income, monthly_expense, 
  createdAt, updatedAt
) VALUES (
  1, '1000000.00', '0.00', '0.00', '0.00', '0.00', 
  NOW(), NOW()
);
```

---

## 验证设置

### 查询一号用户信息

```sql
SELECT 
  u.id,
  u.openId,
  u.name,
  u.email,
  u.role,
  u.is_activated,
  u.invite_code,
  a.available_balance,
  a.frozen_balance,
  a.total_commission
FROM users u
LEFT JOIN assets a ON u.id = a.user_id
WHERE u.id = 1;
```

### 预期结果

| id | openId | name | role | is_activated | available_balance |
|----|--------|------|------|--------------|-------------------|
| 1 | admin-001 | Administrator | admin | 1 | 1000000.00 |

---

## 使用一号账户

### 登录方式

由于一号用户是系统管理员，登录方式有两种：

**方式 1：直接数据库登录（开发环境）**
```
OpenID: admin-001
```

**方式 2：通过 OAuth 登录（生产环境）**
需要在 OAuth 提供商中配置一号用户的身份信息。

### 访问管理后台

1. 登录后进入首页
2. 点击右上角用户菜单
3. 选择"管理后台"
4. 进入管理界面

### 常见操作

**查看资金池监控**
- 路径：管理后台 → 资金池监控
- 功能：实时查看资金分布、流动情况

**审批提现申请**
- 路径：管理后台 → 提现管理
- 功能：审核和批准用户提现

**生成财务报表**
- 路径：管理后台 → 报表中心
- 功能：导出 PDF 或 Excel 格式报表

**管理用户账户**
- 路径：管理后台 → 用户管理
- 功能：查看、编辑、禁用用户

---

## 安全建议

### 密码管理
- 定期修改管理员密码
- 使用强密码（至少 12 位，包含大小写字母、数字、特殊字符）
- 不要共享管理员账户

### 访问控制
- 限制管理员账户的访问 IP
- 启用双因素认证（如可用）
- 定期审查管理员操作日志

### 数据安全
- 定期备份数据库
- 加密敏感数据
- 启用审计日志记录

### 操作规范
- 所有重要操作需要记录
- 定期审查系统日志
- 及时处理安全告警

---

## 常见问题

### Q: 如何重置一号用户密码？
A: 一号用户不使用密码，而是通过 OpenID 认证。如需重置，可以更新数据库中的 openId 字段。

### Q: 如何禁用一号用户？
A: 不建议禁用一号用户，因为系统需要至少一个管理员账户。如需禁用，应先创建另一个管理员账户。

### Q: 初始余额可以修改吗？
A: 可以。通过以下 SQL 修改：
```sql
UPDATE assets SET available_balance = '2000000.00' WHERE user_id = 1;
```

### Q: 如何创建其他管理员账户？
A: 创建新用户后，更新其角色为 admin：
```sql
UPDATE users SET role = 'admin' WHERE id = <user_id>;
```

### Q: 一号用户可以邀请其他用户吗？
A: 可以。一号用户的邀请码是 ADMIN001，其他用户可以使用此邀请码注册。

---

## 相关文件

- **初始化脚本**
  - `scripts/init-admin-user.sql` - SQL 初始化脚本
  - `scripts/init-admin-user.mjs` - Node.js 初始化脚本

- **数据库 Schema**
  - `drizzle/schema.ts` - 数据库表定义

- **管理后台代码**
  - `client/src/pages/admin/` - 管理后台页面
  - `server/routers/admin.ts` - 管理后台 API

---

## 后续步骤

1. **验证账户创建** - 确认一号用户已成功创建
2. **测试管理功能** - 验证管理后台的各项功能
3. **配置系统参数** - 根据需要调整平台参数
4. **创建其他管理员** - 根据需要创建其他管理员账户
5. **启用安全措施** - 配置双因素认证等安全功能

---

**创建时间**: 2026-02-12  
**版本**: 1.0.0  
**状态**: 已验证
