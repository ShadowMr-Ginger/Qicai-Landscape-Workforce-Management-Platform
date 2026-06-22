@echo off
chcp 65001 >nul
echo === 远程部署脚本 ===
echo === 1. 进入后端目录 ===
cd /d "C:\Users\ginger\qicai\green-worker-management-system"

echo === 2. 编译后端 ===
call mvn clean package -DskipTests
if errorlevel 1 (
    echo 后端编译失败，停止部署
    exit /b 1
)

echo === 3. 停止占用 8081 端口的进程 ===
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081 ^| findstr LISTENING') do (
    echo 发现 PID: %%a，正在终止...
    taskkill /PID %%a /F >nul 2>&1
    if errorlevel 1 (
        powershell -Command "Stop-Process -Id %%a -Force" >nul 2>&1
    )
)
timeout /t 2 /nobreak >nul

echo === 4. 启动后端（prod 环境）===
wmic process call create "cmd.exe /c cd /d C:\Users\ginger\qicai\green-worker-management-system && java -Dfile.encoding=UTF-8 -jar target\green-worker-management-system-1.0.0-SNAPSHOT.jar --spring.profiles.active=prod"

echo === 部署完成 ===
