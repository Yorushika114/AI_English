@echo off
chcp 65001 >nul 2>&1
cd /d %~dp0
start /b cmd /c "ping -n 6 127.0.0.1 >nul && start http://localhost:5173"
npm run dev
