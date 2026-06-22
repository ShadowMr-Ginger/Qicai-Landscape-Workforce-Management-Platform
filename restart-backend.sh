#!/bin/bash
# 重启后端服务脚本（适用于 Git Bash / WSL / Linux）

echo "=== 查找占用 8081 端口的进程 ==="
PID=$(netstat -ano 2>/dev/null | grep ':8081' | grep 'LISTENING' | awk '{print $NF}' | head -1)

if [ -n "$PID" ]; then
    echo "发现 PID: $PID，正在终止..."
    powershell -Command "Stop-Process -Id $PID -Force" 2>/dev/null || kill -9 "$PID" 2>/dev/null || true
    sleep 1
    echo "进程已终止"
else
    echo "端口 8081 未被占用"
fi

echo ""
echo "=== 启动 Spring Boot 后端 ==="
cd "$(dirname "$0")/green-worker-management-system" || exit 1
mvn spring-boot:run -q -Dspring-boot.run.jvmArguments="-Dfile.encoding=UTF-8"
