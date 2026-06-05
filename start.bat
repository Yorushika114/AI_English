@echo off
chcp 65001 >nul 2>&1
title AI 英语口语陪练助手

echo ========================================
echo   AI 英语口语陪练助手 - 一键启动
echo ========================================
echo.

:: ── 1. 检查 Node.js ──────────────────────────────────
echo [1/5] 检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo       [错误] 未检测到 Node.js，请先安装 Node.js 18+
    echo       下载地址: https://nodejs.org/
    pause
    exit /b 1
)
for /f "delims=" %%v in ('node --version') do echo       %%v 已就绪

:: ── 2. 安装后端依赖 ───────────────────────────────────
echo [2/5] 检查后端依赖...
if not exist "%~dp0backend\node_modules" (
    echo       未找到，正在安装...
    pushd "%~dp0backend"
    npm install
    if errorlevel 1 (
        echo       [错误] 后端 npm install 失败
        pause
        exit /b 1
    )
    popd
    echo       安装完成
) else (
    echo       已就绪
)

:: ── 3. 安装前端依赖 ───────────────────────────────────
echo [3/5] 检查前端依赖...
if not exist "%~dp0frontend\node_modules" (
    echo       未找到，正在安装...
    pushd "%~dp0frontend"
    npm install
    if errorlevel 1 (
        echo       [错误] 前端 npm install 失败
        pause
        exit /b 1
    )
    popd
    echo       安装完成
) else (
    echo       已就绪
)

:: ── 4. 检查 .env ──────────────────────────────────────
echo [4/5] 检查 backend/.env...
if not exist "%~dp0backend\.env" (
    copy "%~dp0backend\.env.example" "%~dp0backend\.env" >nul
    echo       已自动创建，请在打开的记事本中填入 ANTHROPIC_API_KEY
    echo       保存后关闭记事本，再按任意键继续...
    echo.
    start /wait notepad "%~dp0backend\.env"
)

findstr /C:"ANTHROPIC_API_KEY=your_key_here" "%~dp0backend\.env" >nul 2>&1
if not errorlevel 1 (
    echo       [错误] ANTHROPIC_API_KEY 仍为默认值，请编辑 backend\.env 后重新运行
    pause
    exit /b 1
)
echo       已配置

:: ── 5. 启动服务 ───────────────────────────────────────
echo [5/5] 启动服务...
echo.

start "后端 :3001" cmd /k "chcp 65001 >nul && cd /d "%~dp0backend" && npm run dev"
timeout /t 3 /nobreak >nul

start "前端 :5173" cmd /k "chcp 65001 >nul && cd /d "%~dp0frontend" && npm run dev"
timeout /t 4 /nobreak >nul

start http://localhost:5173

echo ========================================
echo   启动完成！
echo   后端: http://localhost:3001
echo   前端: http://localhost:5173
echo ========================================
echo.
echo   关闭服务：直接关闭"后端"和"前端"两个窗口
echo.
pause
