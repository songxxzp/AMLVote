@echo off
setlocal enabledelayedexpansion

REM 检查参数
set ADD_DEMO=false
set PORT=443

REM 解析参数
:parse_args
if "%~1"=="" goto end_parse
if "%~1"=="--demo" (
    set ADD_DEMO=true
)
if "%~1"=="-d" (
    set ADD_DEMO=true
)
if "%~1"=="--port" (
    shift
    set PORT=%~1
)
echo %~1 | findstr /C:"--port=" >nul
if !errorlevel! equ 0 (
    for /f "tokens=2 delims==" %%a in ("%~1") do set PORT=%%a
)
echo %~1 | findstr /C:"-p" >nul
if !errorlevel! equ 0 (
    set PORT=%~1
    set PORT=!PORT:-p=!
)
shift
goto parse_args

:end_parse

echo 🚀 启动学术作品投票平台...

REM 检查依赖
if not exist "node_modules" (
    echo 📦 安装依赖...
    bun install
)

REM 创建环境变量文件
if not exist ".env" (
    echo 🔧 创建环境配置...
    echo DATABASE_URL=file:./db/custom.db > .env
)

REM 创建必要目录
echo 📁 创建目录...
if not exist "public\uploads" mkdir public\uploads
if not exist "db" mkdir db

REM 初始化数据库
echo 🗄️ 初始化数据库...
bun run db:generate
bun run db:push

REM 检查数据库是否需要初始化
set DATABASE_INITIALIZED=false
if exist "db\custom.db" (
    REM 检查表是否存在
    for /f "tokens=*" %%i in ('sqlite3 db\custom.db "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='Submission'" 2^>nul || echo 0') do set TABLE_EXISTS=%%i
    if !TABLE_EXISTS! gtr 0 set DATABASE_INITIALIZED=true
)

if "!DATABASE_INITIALIZED!"=="false" (
    echo 📊 数据库表已创建
)

REM 添加演示数据（如果指定）
if "%ADD_DEMO%"=="true" (
    echo 📊 添加演示数据...
    bunx tsx prisma/seed.ts
    if !errorlevel! equ 0 (
        echo ✅ 演示数据添加成功
    ) else (
        echo ❌ 演示数据添加失败
        exit /b 1
    )
) else (
    REM 检查是否已有数据
    if "!DATABASE_INITIALIZED!"=="true" (
        for /f "tokens=*" %%i in ('sqlite3 db\custom.db "SELECT COUNT(*) FROM Submission" 2^>nul || echo 0') do set SUBMISSION_COUNT=%%i
        echo ✅ 数据库已存在，包含 !SUBMISSION_COUNT! 个作品
    ) else (
        echo ✅ 空数据库已准备就绪
    )
)

REM 启动服务
echo 🌐 启动服务...
echo ✅ 应用将在 http://localhost:!PORT! 启动
echo 🌐 中文版: http://localhost:!PORT!/zh/
echo 🌐 英文版: http://localhost:!PORT!/en/
echo.
echo 💡 提示:
echo    - 启动时添加演示数据: start.bat --demo
echo    - 指定端口: start.bat --port 3000 或 start.bat -p3000
echo    - 清理数据库: clean-db.bat --help
echo 📝 查看日志: type dev.log
echo 🛑 停止服务: Ctrl+C
echo.

bun run dev -- -p !PORT!