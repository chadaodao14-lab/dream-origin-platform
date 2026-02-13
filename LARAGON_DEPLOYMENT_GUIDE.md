# 梦之源创业投资平台 - Laragon 部署指南

## 🚀 快速部署

### 方法一：使用批处理脚本（推荐新手）
```cmd
双击运行 deploy-laragon.bat
```

### 方法二：使用 PowerShell 脚本（推荐开发者）
```powershell
# 基本部署
.\deploy-laragon.ps1

# 完整部署（包含依赖安装）
.\deploy-laragon.ps1 -Install

# 仅部署不启动服务
.\deploy-laragon.ps1 -StartServices:$false
```

## 📋 部署前准备

1. **确保 Laragon 运行**
   - 启动 Laragon 控制面板
   - 确保 Apache 和 MySQL 服务已启动

2. **检查端口占用**
   - 确保端口 8001（后端）和 3002（前端）未被占用

3. **管理员权限**（可选）
   - 域名解析配置需要管理员权限
   - 可以手动编辑 hosts 文件代替

## 🎯 访问地址

部署完成后可通过以下地址访问：

**前端页面：**
- http://localhost:3002
- http://dreamsource.local （需要域名解析）

**后端API：**
- http://localhost:8001

**API测试端点：**
- 健康检查：http://localhost:8001/health
- 用户数据：http://localhost:8001/api/users
- 入金数据：http://localhost:8001/api/deposits

## 🗄️ 数据库配置

**连接信息：**
- Host: localhost:3306
- User: root
- Password: （空密码）
- Database: dreamsource_db

**初始化：**
```bash
node init-admin-user.mjs
```

## 📁 目录结构

```
D:\laragon\www\dreamsource\
├── client\              # 前端文件
├── server\              # 后端文件
├── logs\               # 日志文件
├── node_modules\       # 依赖包
├── package.json        # 项目配置
└── .env               # 环境变量
```

## 🔧 常见问题

### 1. 端口被占用
```cmd
# 查找占用端口的进程
netstat -ano | findstr :8001
# 结束进程
taskkill /PID <进程ID> /F
```

### 2. 数据库连接失败
- 检查 Laragon MySQL 服务是否启动
- 确认数据库用户权限
- 检查防火墙设置

### 3. 域名无法解析
手动编辑 `C:\Windows\System32\drivers\etc\hosts` 文件，添加：
```
127.0.0.1 dreamsource.local
```

### 4. 依赖安装失败
```cmd
npm cache clean --force
npm install
```

## 🛠️ 开发命令

```bash
# 启动开发服务器
npm run dev

# 启动后端服务
npm run dev:server

# 启动前端服务
npm run dev:client

# 构建生产版本
npm run build

# 运行测试
npm test
```

## 🔒 安全提醒

1. **生产环境配置**
   - 修改默认数据库密码
   - 更换 JWT 密钥
   - 启用 HTTPS
   - 配置防火墙规则

2. **敏感信息保护**
   - 不要提交 .env 文件到版本控制
   - 定期更换密钥
   - 限制数据库访问权限

## 📞 技术支持

如有问题请联系开发团队或查看相关文档。

---
**版本：** 1.0  
**最后更新：** 2026年2月13日