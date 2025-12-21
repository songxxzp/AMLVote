@echo off
setlocal enabledelayedexpansion

echo 🧹 数据库清理工具
echo ==================

REM 检查是否有参数
if "%1"=="" (
    echo 使用方法:
    echo   clean-db.bat [选项]
    echo.
    echo 选项:
    echo   --all         清理所有数据（包括数据库文件）
    echo   --data        清理数据但保留数据库结构
    echo   --reset       完全重置（删除数据库并重新初始化，空白状态）
    echo   --reset-demo  重置并添加演示数据
    echo   --backup      备份当前数据库
    echo   --help        显示帮助信息
    echo.
    goto :eof
)

REM 处理帮助选项
if "%1"=="--help" (
    echo 数据库清理工具 - 详细说明
    echo =========================
    echo.
    echo 选项说明:
    echo.
    echo   --all
    echo     删除整个数据库文件和上传的文件
    echo     影响范围: db\custom.db, public\uploads\*
    echo.
    echo   --data
    echo     只清理数据，保留表结构
    echo     影响范围: 清空所有表数据
    echo.
    echo   --reset
    echo     完全重置: 删除数据库 → 重新创建 → 保持空白
    echo     这会创建一个全新的空数据库
    echo.
    echo   --reset-demo
    echo     重置并添加演示数据: 删除数据库 → 重新创建 → 添加演示数据
    echo     这会重置数据库并立即添加示例数据
    echo.
    echo   --backup
    echo     备份当前数据库到 db\backup\ 目录
    echo.
    echo 示例:
    echo   clean-db.bat --reset     # 完全重置数据库
    echo   clean-db.bat --reset-demo # 重置并添加演示数据
    echo   clean-db.bat --backup    # 备份数据库
    echo.
    goto :eof
)

REM 备份选项
if "%1"=="--backup" (
    echo 📦 备份数据库...

    if not exist "db\custom.db" (
        echo ❌ 数据库文件不存在，无需备份
        exit /b 1
    )

    REM 创建备份目录
    if not exist "db\backup" mkdir db\backup

    REM 生成带时间戳的备份文件名
    for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
    set "YYYY=%dt:~0,4%"
    set "MM=%dt:~4,2%"
    set "DD=%dt:~6,2%"
    set "HH=%dt:~8,2%"
    set "Min=%dt:~10,2%"
    set "Sec=%dt:~12,2%"
    set "TIMESTAMP=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"

    set "BACKUP_FILE=db\backup\custom_backup_%TIMESTAMP%.db"

    REM 复制数据库文件
    copy "db\custom.db" "%BACKUP_FILE%" >nul

    if !errorlevel! equ 0 (
        echo ✅ 数据库备份成功: %BACKUP_FILE%

        REM 显示备份信息
        for %%F in ("%BACKUP_FILE%") do (
            echo 📊 备份文件大小: %%~zF bytes
        )

        REM 统计数据量
        for /f "tokens=*" %%i in ('sqlite3 "%BACKUP_FILE%" "SELECT COUNT(*) FROM User" 2^>nul || echo 0') do set USER_COUNT=%%i
        for /f "tokens=*" %%i in ('sqlite3 "%BACKUP_FILE%" "SELECT COUNT(*) FROM Submission" 2^>nul || echo 0') do set SUBMISSION_COUNT=%%i
        for /f "tokens=*" %%i in ('sqlite3 "%BACKUP_FILE%" "SELECT COUNT(*) FROM Vote" 2^>nul || echo 0') do set VOTE_COUNT=%%i

        echo 📈 备份包含:
        echo    - 用户数: %USER_COUNT%
        echo    - 作品数: %SUBMISSION_COUNT%
        echo    - 投票数: %VOTE_COUNT%
    ) else (
        echo ❌ 数据库备份失败
        exit /b 1
    )

    goto :eof
)

REM 全部清理选项
if "%1"=="--all" (
    echo ⚠️  确认要删除所有数据库文件吗？
    echo 这将删除:
    echo   - 数据库文件 (db\custom.db)
    echo   - 上传的文件 (public\uploads\*)
    echo.
    set /p confirm="输入 'YES' 确认删除: "

    if "!confirm!"=="YES" (
        echo 🗑️  删除数据库文件...
        del /f /q "db\custom.db" 2>nul

        echo 🗑️  删除上传文件...
        if exist "public\uploads" (
            del /f /q "public\uploads\*.*" 2>nul
        )

        echo ✅ 所有数据库文件已清理
    ) else (
        echo ❌ 操作已取消
    )

    goto :eof
)

REM 清理数据选项
if "%1"=="--data" (
    echo ⚠️  确认要清理所有数据吗？
    echo 这将清空所有表的数据，但保留表结构
    echo.
    set /p confirm="输入 'YES' 确认清理: "

    if "!confirm!"=="YES" (
        echo 🧹 清理数据中...

        REM 检查数据库文件是否存在
        if not exist "db\custom.db" (
            echo ❌ 数据库文件不存在，请先运行启动脚本
            exit /b 1
        )

        REM 创建临时SQL文件
        echo DELETE FROM Vote; > temp_clean.sql
        echo DELETE FROM Submission; >> temp_clean.sql
        echo DELETE FROM User; >> temp_clean.sql
        echo VACUUM; >> temp_clean.sql

        REM 执行清理
        sqlite3 db\custom.db < temp_clean.sql

        REM 删除临时文件
        del temp_clean.sql

        if !errorlevel! equ 0 (
            echo ✅ 数据清理完成
        ) else (
            echo ❌ 数据清理失败
            exit /b 1
        )
    ) else (
        echo ❌ 操作已取消
    )

    goto :eof
)

if "%1"=="--reset" (
    echo 🔄 完全重置数据库...
    echo 这将:
    echo   1. 删除所有数据库文件
    echo   2. 重新创建数据库结构
    echo   3. 保持空白（不添加演示数据）
    echo.
    echo 💡 提示：重置后使用 start.bat --demo 添加演示数据
    echo.
    set /p confirm="输入 'YES' 确认重置: "

    if "!confirm!"=="YES" (
        REM 备份现有数据库（如果存在）
        if exist "db\custom.db" (
            echo 📦 备份现有数据库...
            if not exist "db\backup" mkdir db\backup

            for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
            set "YYYY=%dt:~0,4%"
            set "MM=%dt:~4,2%"
            set "DD=%dt:~6,2%"
            set "HH=%dt:~8,2%"
            set "Min=%dt:~10,2%"
            set "Sec=%dt:~12,2%"
            set "TIMESTAMP=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"

            copy "db\custom.db" "db\backup\custom_backup_before_reset_%TIMESTAMP%.db" >nul
        )

        REM 删除所有可能的数据库文件
        echo 🗑️  删除数据库文件...
        del /f /q "db\custom.db" 2>nul
        del /f /q "prisma\db\custom.db" 2>nul
        rmdir /s /q "prisma\db" 2>nul

        REM 重新初始化
        echo 🔧 重新初始化数据库...
        bun run db:generate
        if !errorlevel! neq 0 (
            echo ❌ 数据库初始化失败
            exit /b 1
        )

        bun run db:push
        if !errorlevel! neq 0 (
            echo ❌ 数据库初始化失败
            exit /b 1
        )

        echo ✅ 数据库重置完成（空白状态）
        echo.
        echo 💡 下一步操作：
        echo    - 启动应用: start.bat
        echo    - 启动并添加演示数据: start.bat --demo
    ) else (
        echo ❌ 操作已取消
    )

    goto :eof
)

if "%1"=="--reset-demo" (
    echo 🔄 重置数据库并添加演示数据...
    echo 这将:
    echo   1. 删除所有数据库文件
    echo   2. 重新创建数据库结构
    echo   3. 添加演示数据
    echo.
    set /p confirm="输入 'YES' 确认重置: "

    if "!confirm!"=="YES" (
        REM 备份现有数据库（如果存在）
        if exist "db\custom.db" (
            echo 📦 备份现有数据库...
            if not exist "db\backup" mkdir db\backup

            for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
            set "YYYY=%dt:~0,4%"
            set "MM=%dt:~4,2%"
            set "DD=%dt:~6,2%"
            set "HH=%dt:~8,2%"
            set "Min=%dt:~10,2%"
            set "Sec=%dt:~12,2%"
            set "TIMESTAMP=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"

            copy "db\custom.db" "db\backup\custom_backup_before_reset_demo_%TIMESTAMP%.db" >nul
        )

        REM 删除所有可能的数据库文件
        echo 🗑️  删除数据库文件...
        del /f /q "db\custom.db" 2>nul
        del /f /q "prisma\db\custom.db" 2>nul
        rmdir /s /q "prisma\db" 2>nul

        REM 重新初始化
        echo 🔧 重新初始化数据库...
        bun run db:generate
        if !errorlevel! neq 0 (
            echo ❌ 数据库初始化失败
            exit /b 1
        )

        bun run db:push
        if !errorlevel! neq 0 (
            echo ❌ 数据库初始化失败
            exit /b 1
        )

        REM 填充演示数据
        echo 📊 添加演示数据...
        bunx tsx prisma\seed.ts

        if !errorlevel! equ 0 (
            echo ✅ 数据库重置完成
            echo.
            echo 📊 演示数据包含:

            for /f "tokens=*" %%i in ('sqlite3 db\custom.db "SELECT COUNT(*) FROM Submission" 2^>nul || echo 0') do set SUBMISSION_COUNT=%%i
            for /f "tokens=*" %%i in ('sqlite3 db\custom.db "SELECT COUNT(*) FROM User" 2^>nul || echo 0') do set USER_COUNT=%%i
            for /f "tokens=*" %%i in ('sqlite3 db\custom.db "SELECT COUNT(*) FROM Vote" 2^>nul || echo 0') do set VOTE_COUNT=%%i

            echo    - 用户数: !USER_COUNT!
            echo    - 作品数: !SUBMISSION_COUNT!
            echo    - 投票数: !VOTE_COUNT!
        ) else (
            echo ❌ 演示数据添加失败
            exit /b 1
        )
    ) else (
        echo ❌ 操作已取消
    )

    goto :eof
)

REM 未知选项
echo ❌ 未知选项: %1
echo 使用 --help 查看帮助信息
exit /b 1