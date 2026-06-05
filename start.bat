@echo off
chcp 65001 >nul 2>&1

echo ========================================
echo   AI 英语口语陪练助手 - 后端启动
echo ========================================
echo.

cd /d "%~dp0backend"

:: ── 1. 检查 Node.js ──────────────────────────────────
echo [检查] Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js 18+
    echo        下载地址: https://nodejs.org/
    pause
    exit /b 1
)
for /f "delims=" %%v in ('node --version') do echo        %%v 已就绪

:: ── 2. 检查 npm 依赖 ─────────────────────────────────
echo [检查] node_modules...
if not exist "node_modules" (
    echo        未找到，正在安装依赖...
    npm install
    if errorlevel 1 (
        echo [错误] npm install 失败，请检查网络连接后重试
        pause
        exit /b 1
    )
    echo        依赖安装完成
) else (
    echo        已存在，跳过安装
)

:: ── 3. 检查 .env ──────────────────────────────────────
echo [检查] .env...
if not exist ".env" (
    copy ".env.example" ".env" >nul
    echo        已从 .env.example 自动复制
    echo.
    echo [操作] 请在打开的记事本中填入你的 ANTHROPIC_API_KEY，保存后重新运行此脚本。
    echo.
    start notepad ".env"
    pause
    exit /b 0
)
echo        已存在

:: ── 4. 检查 API Key 是否已填写 ───────────────────────
echo [检查] ANTHROPIC_API_KEY...
findstr /C:"ANTHROPIC_API_KEY=your_key_here" ".env" >nul 2>&1
if not errorlevel 1 (
    echo        [错误] 仍为默认占位值，请编辑 backend\.env 填入真实 Key
    pause
    exit /b 1
)
findstr /C:"ANTHROPIC_API_KEY=" ".env" >nul 2>&1
if errorlevel 1 (
    echo        [错误] .env 中未找到 ANTHROPIC_API_KEY 字段，请检查文件内容
    pause
    exit /b 1
)
echo        已配置

:: ── 5. 启动 ──────────────────────────────────────────
echo.
echo [启动] 后端服务启动中（端口 3001）...
echo [提示] 按 Ctrl+C 可停止服务
echo.
npm run dev
