#!/bin/bash

echo "🧹 数据库清理工具"
echo "=================="

# 检查是否有参数
if [ $# -eq 0 ]; then
    echo "使用方法:"
    echo "  ./clean-db.sh [选项]"
    echo ""
    echo "选项:"
    echo "  --all         清理所有数据（包括数据库文件）"
    echo "  --data        清理数据但保留数据库结构"
    echo "  --reset       完全重置（删除数据库并重新初始化，空白状态）"
    echo "  --reset-demo  重置并添加演示数据"
    echo "  --backup      备份当前数据库"
    echo "  --help        显示帮助信息"
    echo ""
    exit 0
fi

# 处理帮助选项
if [ "$1" = "--help" ]; then
    echo "数据库清理工具 - 详细说明"
    echo "========================="
    echo ""
    echo "选项说明:"
    echo ""
    echo "  --all"
    echo "    删除整个数据库文件和上传的文件"
    echo "    影响范围: db/custom.db, public/uploads/*"
    echo ""
    echo "  --data"
    echo "    只清理数据，保留表结构"
    echo "    影响范围: 清空所有表数据"
    echo ""
    echo "  --reset"
    echo "    完全重置: 删除数据库 → 重新创建 → 保持空白"
    echo "    这会创建一个全新的空数据库"
    echo ""
    echo "  --reset-demo"
    echo "    重置并添加演示数据: 删除数据库 → 重新创建 → 添加演示数据"
    echo "    这会重置数据库并立即添加示例数据"
    echo ""
    echo "  --backup"
    echo "    备份当前数据库到 db/backup/ 目录"
    echo ""
    echo "示例:"
    echo "  ./clean-db.sh --reset     # 完全重置数据库"
    echo "  ./clean-db.sh --backup    # 备份数据库"
    echo ""
    exit 0
fi

# 备份选项
if [ "$1" = "--backup" ]; then
    echo "📦 备份数据库..."

    if [ ! -f "db/custom.db" ]; then
        echo "❌ 数据库文件不存在，无需备份"
        exit 1
    fi

    # 创建备份目录
    mkdir -p db/backup

    # 生成带时间戳的备份文件名
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="db/backup/custom_backup_${TIMESTAMP}.db"

    # 复制数据库文件
    cp db/custom.db "$BACKUP_FILE"

    if [ $? -eq 0 ]; then
        echo "✅ 数据库备份成功: $BACKUP_FILE"

        # 显示备份信息
        SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo "📊 备份文件大小: $SIZE"

        # 统计数据量
        USER_COUNT=$(sqlite3 "$BACKUP_FILE" "SELECT COUNT(*) FROM User" 2>/dev/null || echo "0")
        SUBMISSION_COUNT=$(sqlite3 "$BACKUP_FILE" "SELECT COUNT(*) FROM Submission" 2>/dev/null || echo "0")
        VOTE_COUNT=$(sqlite3 "$BACKUP_FILE" "SELECT COUNT(*) FROM Vote" 2>/dev/null || echo "0")

        echo "📈 备份包含:"
        echo "   - 用户数: $USER_COUNT"
        echo "   - 作品数: $SUBMISSION_COUNT"
        echo "   - 投票数: $VOTE_COUNT"
    else
        echo "❌ 数据库备份失败"
        exit 1
    fi

    exit 0
fi

# 全部清理选项
if [ "$1" = "--all" ]; then
    echo "⚠️  确认要删除所有数据库文件吗？"
    echo "这将删除:"
    echo "  - 数据库文件 (db/custom.db)"
    echo "  - 上传的文件 (public/uploads/*)"
    echo ""
    read -p "输入 'YES' 确认删除: " confirm

    if [ "$confirm" = "YES" ]; then
        echo "🗑️  删除数据库文件..."
        rm -f db/custom.db

        echo "🗑️  删除上传文件..."
        rm -rf public/uploads/*

        echo "✅ 所有数据库文件已清理"
    else
        echo "❌ 操作已取消"
    fi

    exit 0
fi

# 清理数据选项
if [ "$1" = "--data" ]; then
    echo "⚠️  确认要清理所有数据吗？"
    echo "这将清空所有表的数据，但保留表结构"
    echo ""
    read -p "输入 'YES' 确认清理: " confirm

    if [ "$confirm" = "YES" ]; then
        echo "🧹 清理数据中..."

        # 检查数据库文件是否存在
        if [ ! -f "db/custom.db" ]; then
            echo "❌ 数据库文件不存在，请先运行启动脚本"
            exit 1
        fi

        # 清理数据（保留表结构）
        sqlite3 db/custom.db <<EOF
DELETE FROM Vote;
DELETE FROM Submission;
DELETE FROM User;
VACUUM;
EOF

        if [ $? -eq 0 ]; then
            echo "✅ 数据清理完成"
        else
            echo "❌ 数据清理失败"
            exit 1
        fi
    else
        echo "❌ 操作已取消"
    fi

    exit 0
fi

# 重置选项
if [ "$1" = "--reset" ]; then
    echo "🔄 完全重置数据库..."
    echo "这将:"
    echo "  1. 删除所有数据库文件"
    echo "  2. 重新创建数据库结构"
    echo "  3. 保持空白（不添加演示数据）"
    echo ""
    echo "💡 提示：重置后使用 ./start.sh --demo 添加演示数据"
    echo ""
    read -p "输入 'YES' 确认重置: " confirm

    if [ "$confirm" = "YES" ]; then
        # 备份现有数据库（如果存在）
        if [ -f "db/custom.db" ]; then
            echo "📦 备份现有数据库..."
            mkdir -p db/backup
            TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
            cp db/custom.db "db/backup/custom_backup_before_reset_${TIMESTAMP}.db"
        fi

        # 删除所有可能的数据库文件
        echo "🗑️  删除数据库文件..."
        rm -f db/custom.db
        rm -f prisma/db/custom.db
        rm -rf prisma/db/

        # 重新初始化
        echo "🔧 重新初始化数据库..."
        bun run db:generate
        bun run db:push

        if [ $? -ne 0 ]; then
            echo "❌ 数据库初始化失败"
            exit 1
        fi

        echo "✅ 数据库重置完成（空白状态）"
        echo ""
        echo "💡 下一步操作："
        echo "   - 启动应用: ./start.sh"
        echo "   - 启动并添加演示数据: ./start.sh --demo"
    else
        echo "❌ 操作已取消"
    fi

    exit 0
fi

# 重置并添加演示数据选项
if [ "$1" = "--reset-demo" ]; then
    echo "🔄 重置数据库并添加演示数据..."
    echo "这将:"
    echo "  1. 删除所有数据库文件"
    echo "  2. 重新创建数据库结构"
    echo "  3. 添加演示数据"
    echo ""
    read -p "输入 'YES' 确认重置: " confirm

    if [ "$confirm" = "YES" ]; then
        # 备份现有数据库（如果存在）
        if [ -f "db/custom.db" ]; then
            echo "📦 备份现有数据库..."
            mkdir -p db/backup
            TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
            cp db/custom.db "db/backup/custom_backup_before_reset_demo_${TIMESTAMP}.db"
        fi

        # 删除所有可能的数据库文件
        echo "🗑️  删除数据库文件..."
        rm -f db/custom.db
        rm -f prisma/db/custom.db
        rm -rf prisma/db/

        # 重新初始化
        echo "🔧 重新初始化数据库..."
        bun run db:generate
        bun run db:push

        if [ $? -ne 0 ]; then
            echo "❌ 数据库初始化失败"
            exit 1
        fi

        # 填充演示数据
        echo "📊 添加演示数据..."
        bunx tsx prisma/seed.ts

        if [ $? -eq 0 ]; then
            echo "✅ 数据库重置完成"
            echo ""
            echo "📊 演示数据包含:"
            SUBMISSION_COUNT=$(sqlite3 db/custom.db "SELECT COUNT(*) FROM Submission" 2>/dev/null || echo "0")
            USER_COUNT=$(sqlite3 db/custom.db "SELECT COUNT(*) FROM User" 2>/dev/null || echo "0")
            VOTE_COUNT=$(sqlite3 db/custom.db "SELECT COUNT(*) FROM Vote" 2>/dev/null || echo "0")

            echo "   - 用户数: $USER_COUNT"
            echo "   - 作品数: $SUBMISSION_COUNT"
            echo "   - 投票数: $VOTE_COUNT"
        else
            echo "❌ 演示数据添加失败"
            exit 1
        fi
    else
        echo "❌ 操作已取消"
    fi

    exit 0
fi

# 未知选项
echo "❌ 未知选项: $1"
echo "使用 --help 查看帮助信息"
exit 1