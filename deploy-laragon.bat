@echo off
title 梦之源创业投资平台 - Laragon 部署脚本
color 0A

echo ========================================
echo 梦之源创业投资平台 - Laragon 部署工具
echo ========================================
echo.

:: 检查 Laragon 是否运行
echo [1/8] 检查 Laragon 环境...
if not exist "D:\laragon\bin\apache\httpd.exe" (
    echo 错误: 未找到 Laragon Apache
    echo 请确保 Laragon 已正确安装并运行
    pause
    exit /b 1
)

if not exist "D:\laragon\bin\mysql\mysql.exe" (
    echo 错误: 未找到 Laragon MySQL
    echo 请确保 Laragon MySQL 服务已启动
    pause
    exit /b 1
)

echo ✓ Laragon 环境检查通过
echo.

:: 设置环境变量
echo [2/8] 配置环境变量...
copy .env.laragon .env >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ 环境变量配置完成
) else (
    echo ! 环境变量配置失败，使用默认配置
)
echo.

:: 安装依赖
echo [3/8] 安装项目依赖...
npm install --silent
if %errorlevel% equ 0 (
    echo ✓ 依赖安装完成
) else (
    echo ! 依赖安装出现问题，继续执行
)
echo.

:: 创建数据库
echo [4/8] 初始化数据库...
node init-admin-user.mjs
if %errorlevel% equ 0 (
    echo ✓ 数据库初始化完成
) else (
    echo ! 数据库初始化失败，请手动执行
)
echo.

:: 创建日志目录
echo [5/8] 创建日志目录...
if not exist "D:\laragon\www\dreamsource\logs" (
    mkdir "D:\laragon\www\dreamsource\logs" >nul 2>&1
    echo ✓ 日志目录创建完成
) else (
    echo ✓ 日志目录已存在
)
echo.

:: 启动服务
echo [6/8] 启动后端服务...
start "DreamSource Backend" cmd /c "cd /d D:\laragon\www\dreamsource && npm run dev:server"
timeout /t 3 /nobreak >nul
echo ✓ 后端服务启动中...

echo [7/8] 启动前端服务...
start "DreamSource Frontend" cmd /c "cd /d D:\laragon\www\dreamsource && npm run dev:client"
timeout /t 3 /nobreak >nul
echo ✓ 前端服务启动中...
echo.

:: 配置 Hosts 文件
echo [8/8] 配置域名解析...
echo 127.0.0.1 dreamsource.local >> %SystemRoot%\System32\drivers\etc\hosts 2>nul
if %errorlevel% equ 0 (
    echo ✓ 域名解析配置完成
) else (
    echo ! 域名解析配置需要管理员权限
)
echo.

:: 显示访问信息
echo ========================================
echo 部署完成！
echo ========================================
echo.
echo 访问地址:
echo 前端页面: http://localhost:3002 或 http://dreamsource.local
echo 后端API:  http://localhost:8001
echo.
echo API测试端点:
echo 健康检查: http://localhost:8001/health
echo 用户数据: http://localhost:8001/api/users
echo 入金数据: http://localhost:8001/api/deposits
echo.
echo 数据库信息:
echo Host: localhost:3306
echo User: root
echo Database: dreamsource_db
echo.
echo 日志文件位置:
echo D:\laragon\www\dreamsource\logs\
echo.
echo 按任意键打开浏览器访问...
pause >nul

:: 打开浏览器
start http://localhost:3002
start http://localhost:8001/health

echo 部署脚本执行完毕！