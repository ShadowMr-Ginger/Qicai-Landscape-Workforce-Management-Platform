#!/bin/bash
# 重启前端服务脚本（适用于 Git Bash / WSL / Linux）
# 功能：检查 3000 端口占用，终止旧进程，重新构建并启动 Next.js 前端

PORT=3001

echo "=== 查找占用 $PORT 端口的进程 ==="

PID=""

# 方式1: lsof (Linux / macOS)
if command -v lsof >/dev/null 2>&1; then
    PID=$(lsof -ti:$PORT 2>/dev/null | head -1)
fi

# 方式2: fuser (Linux)
if [ -z "$PID" ] && command -v fuser >/dev/null 2>&1; then
    PID=$(fuser "$PORT"/tcp 2>/dev/null | awk '{print $1}' | head -1)
fi

# 方式3: netstat (Windows Git Bash)
if [ -z "$PID" ]; then
    PID=$(netstat -ano 2>/dev/null | grep ":$PORT" | grep 'LISTENING' | awk '{print $NF}' | head -1)
fi

if [ -n "$PID" ]; then
    echo "发现 PID: $PID，正在终止..."
    kill -9 "$PID" 2>/dev/null || powershell -Command "Stop-Process -Id $PID -Force" 2>/dev/null || true
    sleep 1
    echo "进程已终止"
else
    echo "端口 $PORT 未被占用"
fi

echo ""
echo "=== 重新部署前端 ==="
cd "$(dirname "$0")/landscape-admin-web" || exit 1

echo "安装依赖（如已安装会自动跳过）..."
npm install

echo "构建生产包..."
npm run build

echo "启动前端服务..."
nohup npm start > ../frontend.log 2>&1 &
sleep 2

echo ""
echo "前端服务已启动，日志文件: frontend.log"
echo "访问地址: http://localhost:$PORT"
