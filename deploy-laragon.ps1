# 梦之源创业投资平台 - Laragon PowerShell 部署脚本
# 作者: AI Assistant
# 版本: 1.0

param(
    [switch]$Install = $false,
    [switch]$Deploy = $true,
    [switch]$StartServices = $true,
    [switch]$OpenBrowser = $true
)

# 颜色输出函数
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

# 检查管理员权限
function Test-Administrator {
    $currentUser = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# 主部署函数
function Deploy-DreamSource {
    Clear-Host
    Write-ColorOutput "========================================" "Green"
    Write-ColorOutput "梦之源创业投资平台 - Laragon 部署工具" "Green"
    Write-ColorOutput "========================================" "Green"
    Write-ColorOutput ""

    # 1. 检查 Laragon 环境
    Write-ColorOutput "[1/8] 检查 Laragon 环境..." "Yellow"
    if (-not (Test-Path "D:\laragon\bin\apache\httpd.exe")) {
        Write-ColorOutput "错误: 未找到 Laragon Apache" "Red"
        Write-ColorOutput "请确保 Laragon 已正确安装并运行" "Red"
        return $false
    }

    if (-not (Test-Path "D:\laragon\bin\mysql\mysql.exe")) {
        Write-ColorOutput "错误: 未找到 Laragon MySQL" "Red"
        Write-ColorOutput "请确保 Laragon MySQL 服务已启动" "Red"
        return $false
    }
    Write-ColorOutput "✓ Laragon 环境检查通过" "Green"
    Write-ColorOutput ""

    # 2. 设置环境变量
    Write-ColorOutput "[2/8] 配置环境变量..." "Yellow"
    if (Test-Path ".env.laragon") {
        Copy-Item ".env.laragon" ".env" -Force
        Write-ColorOutput "✓ 环境变量配置完成" "Green"
    } else {
        Write-ColorOutput "! 未找到 .env.laragon 文件，使用默认配置" "Yellow"
    }
    Write-ColorOutput ""

    # 3. 安装依赖（如果指定了-install参数）
    if ($Install) {
        Write-ColorOutput "[3/8] 安装项目依赖..." "Yellow"
        npm install --silent
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✓ 依赖安装完成" "Green"
        } else {
            Write-ColorOutput "! 依赖安装出现问题，继续执行" "Yellow"
        }
        Write-ColorOutput ""
    }

    # 4. 创建数据库
    Write-ColorOutput "[4/8] 初始化数据库..." "Yellow"
    if (Test-Path "init-admin-user.mjs") {
        node init-admin-user.mjs
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✓ 数据库初始化完成" "Green"
        } else {
            Write-ColorOutput "! 数据库初始化失败，请手动执行" "Yellow"
        }
    } else {
        Write-ColorOutput "! 未找到数据库初始化脚本" "Yellow"
    }
    Write-ColorOutput ""

    # 5. 创建日志目录
    Write-ColorOutput "[5/8] 创建日志目录..." "Yellow"
    $logPath = "D:\laragon\www\dreamsource\logs"
    if (-not (Test-Path $logPath)) {
        New-Item -ItemType Directory -Path $logPath -Force | Out-Null
        Write-ColorOutput "✓ 日志目录创建完成" "Green"
    } else {
        Write-ColorOutput "✓ 日志目录已存在" "Green"
    }
    Write-ColorOutput ""

    # 6. 启动服务
    if ($StartServices) {
        Write-ColorOutput "[6/8] 启动后端服务..." "Yellow"
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\laragon\www\dreamsource'; npm run dev:server" -WindowStyle Normal
        Start-Sleep -Seconds 3
        Write-ColorOutput "✓ 后端服务启动中..." "Green"

        Write-ColorOutput "[7/8] 启动前端服务..." "Yellow"
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\laragon\www\dreamsource'; npm run dev:client" -WindowStyle Normal
        Start-Sleep -Seconds 3
        Write-ColorOutput "✓ 前端服务启动中..." "Green"
        Write-ColorOutput ""
    }

    # 7. 配置 Hosts 文件
    Write-ColorOutput "[8/8] 配置域名解析..." "Yellow"
    $hostsEntry = "127.0.0.1 dreamsource.local"
    $hostsFile = "$env:SystemRoot\System32\drivers\etc\hosts"
    
    if (Test-Administrator) {
        if (-not (Select-String -Path $hostsFile -Pattern "dreamsource.local" -Quiet)) {
            Add-Content -Path $hostsFile -Value $hostsEntry
            Write-ColorOutput "✓ 域名解析配置完成" "Green"
        } else {
            Write-ColorOutput "✓ 域名解析已配置" "Green"
        }
    } else {
        Write-ColorOutput "! 域名解析配置需要管理员权限" "Yellow"
        Write-ColorOutput "请手动添加以下内容到 hosts 文件:" "Yellow"
        Write-ColorOutput $hostsEntry "Cyan"
    }
    Write-ColorOutput ""

    # 8. 显示访问信息
    Write-ColorOutput "========================================" "Green"
    Write-ColorOutput "部署完成！" "Green"
    Write-ColorOutput "========================================" "Green"
    Write-ColorOutput ""
    Write-ColorOutput "访问地址:" "Cyan"
    Write-ColorOutput "前端页面: http://localhost:3002 或 http://dreamsource.local" "White"
    Write-ColorOutput "后端API:  http://localhost:8001" "White"
    Write-ColorOutput ""
    Write-ColorOutput "API测试端点:" "Cyan"
    Write-ColorOutput "健康检查: http://localhost:8001/health" "White"
    Write-ColorOutput "用户数据: http://localhost:8001/api/users" "White"
    Write-ColorOutput "入金数据: http://localhost:8001/api/deposits" "White"
    Write-ColorOutput ""
    Write-ColorOutput "数据库信息:" "Cyan"
    Write-ColorOutput "Host: localhost:3306" "White"
    Write-ColorOutput "User: root" "White"
    Write-ColorOutput "Database: dreamsource_db" "White"
    Write-ColorOutput ""
    Write-ColorOutput "日志文件位置:" "Cyan"
    Write-ColorOutput "$logPath" "White"
    Write-ColorOutput ""
    
    if ($OpenBrowser) {
        Write-ColorOutput "正在打开浏览器..." "Yellow"
        Start-Process "http://localhost:3002"
        Start-Process "http://localhost:8001/health"
    }

    Write-ColorOutput "部署脚本执行完毕！" "Green"
    return $true
}

# 执行部署
$result = Deploy-DreamSource

if (-not $result) {
    Write-ColorOutput "部署过程中出现错误，请检查上述信息。" "Red"
    pause
}