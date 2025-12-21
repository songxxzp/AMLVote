@echo off
echo 🚀 启动学术作品投票平台...

REM 检查依赖
if not exist "node_modules" (
    echo 📦 安装依赖...
    bun install
)

REM 创建必要目录
echo 📁 创建目录...
if not exist "public\uploads" mkdir public\uploads
if not exist "db" mkdir db

REM 初始化数据库
echo 🗄️ 初始化数据库...
bun run db:generate
bun run db:push

REM 检查是否有示例数据
echo 📊 检查示例数据...
bunx ts-node prisma/seed.ts

REM 启动服务
echo 🌐 启动服务...
echo ✅ 应用将在 http://localhost:3000 启动
echo 📝 查看日志: type dev.log
echo 🛑 停止服务: Ctrl+C
echo.

bun run dev