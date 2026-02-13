# DreamSource Investment Platform - Laragon Deployment Script

Write-Host "========================================" -ForegroundColor Green
Write-Host "DreamSource Investment Platform - Laragon Deployment" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check Laragon environment
Write-Host "[1/6] Checking Laragon environment..." -ForegroundColor Yellow
$apachePath = Get-ChildItem "D:\laragon\bin\apache" -Recurse -Filter "httpd.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
$mysqlPath = Get-ChildItem "D:\laragon\bin\mysql" -Recurse -Filter "mysql.exe" -ErrorAction SilentlyContinue | Select-Object -First 1

if (-not $apachePath) {
    Write-Host "Error: Laragon Apache not found" -ForegroundColor Red
    Write-Host "Please ensure Laragon is installed and running" -ForegroundColor Red
    exit 1
}

if (-not $mysqlPath) {
    Write-Host "Error: Laragon MySQL not found" -ForegroundColor Red
    Write-Host "Please ensure Laragon MySQL service is started" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Laragon environment check passed" -ForegroundColor Green
Write-Host ""

# Configure environment variables
Write-Host "[2/6] Configuring environment variables..." -ForegroundColor Yellow
if (Test-Path ".env.laragon") {
    Copy-Item ".env.laragon" ".env" -Force
    Write-Host "✓ Environment variables configured" -ForegroundColor Green
} else {
    Write-Host "! .env.laragon file not found, using defaults" -ForegroundColor Yellow
}
Write-Host ""

# Install dependencies
Write-Host "[3/6] Installing dependencies..." -ForegroundColor Yellow
npm install --silent
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "! Dependency installation had issues, continuing..." -ForegroundColor Yellow
}
Write-Host ""

# Initialize database
Write-Host "[4/6] Initializing database..." -ForegroundColor Yellow
if (Test-Path "init-admin-user.mjs") {
    node init-admin-user.mjs
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database initialized" -ForegroundColor Green
    } else {
        Write-Host "! Database initialization failed, please run manually" -ForegroundColor Yellow
    }
} else {
    Write-Host "! Database initialization script not found" -ForegroundColor Yellow
}
Write-Host ""

# Create log directory
Write-Host "[5/6] Creating log directory..." -ForegroundColor Yellow
$logPath = "D:\laragon\www\dreamsource\logs"
if (-not (Test-Path $logPath)) {
    New-Item -ItemType Directory -Path $logPath -Force | Out-Null
    Write-Host "✓ Log directory created" -ForegroundColor Green
} else {
    Write-Host "✓ Log directory already exists" -ForegroundColor Green
}
Write-Host ""

# Configure hosts file
Write-Host "[6/6] Configuring domain resolution..." -ForegroundColor Yellow
$hostsEntry = "127.0.0.1 dreamsource.local"
$hostsFile = "$env:SystemRoot\System32\drivers\etc\hosts"

# Check if already configured
if (Select-String -Path $hostsFile -Pattern "dreamsource.local" -Quiet) {
    Write-Host "✓ Domain already configured" -ForegroundColor Green
} else {
    # Try to add entry
    try {
        Add-Content -Path $hostsFile -Value $hostsEntry
        Write-Host "✓ Domain resolution configured" -ForegroundColor Green
    } catch {
        Write-Host "! Administrator privileges required for domain configuration" -ForegroundColor Yellow
        Write-Host "Please manually add to hosts file: $hostsEntry" -ForegroundColor Cyan
    }
}
Write-Host ""

# Display access information
Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access URLs:" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3002 or http://dreamsource.local" -ForegroundColor White
Write-Host "Backend API: http://localhost:8001" -ForegroundColor White
Write-Host ""
Write-Host "API Endpoints:" -ForegroundColor Cyan
Write-Host "Health Check: http://localhost:8001/health" -ForegroundColor White
Write-Host "User Data: http://localhost:8001/api/users" -ForegroundColor White
Write-Host "Deposit Data: http://localhost:8001/api/deposits" -ForegroundColor White
Write-Host ""
Write-Host "Database Info:" -ForegroundColor Cyan
Write-Host "Host: localhost:3306" -ForegroundColor White
Write-Host "User: root" -ForegroundColor White
Write-Host "Database: dreamsource_db" -ForegroundColor White
Write-Host ""
Write-Host "Log Location:" -ForegroundColor Cyan
Write-Host "$logPath" -ForegroundColor White
Write-Host ""
Write-Host "To start services, run:" -ForegroundColor Yellow
Write-Host "npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Deployment script completed!" -ForegroundColor Green