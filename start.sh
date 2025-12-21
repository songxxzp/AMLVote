#!/bin/bash

echo "🚀 启动学术作品投票平台..."

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    bun install
fi

# 创建必要目录
echo "📁 创建目录..."
mkdir -p public/uploads
mkdir -p db

# 初始化数据库
echo "🗄️ 初始化数据库..."
bun run db:generate
bun run db:push

# 检查是否有示例数据
if [ ! -f "db/custom.db" ] || [ $(sqlite3 db/custom.db "SELECT COUNT(*) FROM Submission" 2>/dev/null || echo "0") -eq 0 ]; then
    echo "📊 填充示例数据..."
    bunx ts-node prisma/seed.ts
fi

# 启动服务
echo "🌐 启动服务..."
echo "✅ 应用将在 http://localhost:3000 启动"
echo "📝 查看日志: tail -f dev.log"
echo "🛑 停止服务: Ctrl+C"
echo ""

bun run dev