@echo off
chcp 65001 >nul
echo === 查找占用 8081 端口的进程 ===

set PID=
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081 ^| findstr LISTENING') do (
    set PID=%%a
)

if defined PID (
    echo 发现 PID: %PID%，正在终止...
    taskkill /PID %PID% /F >nul 2>&1
    if errorlevel 1 (
        powershell -Command "Stop-Process -Id %PID% -Force" >nul 2>&1
    )
    timeout /t 1 /nobreak >nul
    echo 进程已终止
) else (
    echo 端口 8081 未被占用
)

echo.
echo === 启动 Spring Boot 后端 ===
cd /d "%~dp0green-worker-management-system"
call mvn spring-boot:run -q -Dspring-boot.run.jvmArguments="-Dfile.encoding=UTF-8"
