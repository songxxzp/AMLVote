#!/bin/bash

# 检查参数
ADD_DEMO=false
for arg in "$@"; do
    if [ "$arg" = "--demo" ] || [ "$arg" = "-d" ]; then
        ADD_DEMO=true
        break
    fi
done

echo "🚀 启动学术作品投票平台..."

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    bun install
fi

# 创建环境变量文件
if [ ! -f ".env" ]; then
    echo "🔧 创建环境配置..."
    echo "DATABASE_URL=file:./db/custom.db" > .env
fi

# 创建必要目录
echo "📁 创建目录..."
mkdir -p public/uploads
mkdir -p db

# 初始化数据库
echo "🗄️ 初始化数据库..."
bun run db:generate
bun run db:push

# 检查数据库是否需要初始化
DATABASE_INITIALIZED=false
if [ -f "db/custom.db" ]; then
    # 检查表是否存在
    TABLE_EXISTS=$(sqlite3 db/custom.db "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='Submission'" 2>/dev/null || echo "0")
    if [ "$TABLE_EXISTS" -gt 0 ]; then
        DATABASE_INITIALIZED=true
    fi
fi

if [ "$DATABASE_INITIALIZED" = false ]; then
    echo "📊 数据库表已创建"
fi

# 添加演示数据（如果指定）
if [ "$ADD_DEMO" = true ]; then
    echo "📊 添加演示数据..."
    bunx tsx prisma/seed.ts
    if [ $? -eq 0 ]; then
        echo "✅ 演示数据添加成功"
    else
        echo "❌ 演示数据添加失败"
        exit 1
    fi
else
    # 检查是否已有数据
    if [ "$DATABASE_INITIALIZED" = true ]; then
        SUBMISSION_COUNT=$(sqlite3 db/custom.db "SELECT COUNT(*) FROM Submission" 2>/dev/null || echo "0")
        echo "✅ 数据库已存在，包含 $SUBMISSION_COUNT 个作品"
    else
        echo "✅ 空数据库已准备就绪"
    fi
fi

# 启动服务
echo "🌐 启动服务..."
echo "✅ 应用将在 http://localhost:3000 启动"
echo "🌐 中文版: http://localhost:3000/zh/"
echo "🌐 英文版: http://localhost:3000/en/"
echo ""
echo "💡 提示:"
echo "   - 启动时添加演示数据: ./start.sh --demo"
echo "   - 清理数据库: ./clean-db.sh --help"
echo "📝 查看日志: tail -f dev.log"
echo "🛑 停止服务: Ctrl+C"
echo ""

bun run dev