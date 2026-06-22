#!/bin/bash
set -e

DEPLOY_DIR=/home/deploy/qicai
cd "$DEPLOY_DIR"

# 加载环境变量（由 GitHub Actions 写入）
if [ -f .env ]; then
  echo "=== Loading environment variables ==="
  set -a
  # shellcheck source=/dev/null
  source .env
  set +a
fi

# 备份当前运行版本
BACKUP_DIR=/home/deploy/qicai-backup-$(date +%Y%m%d-%H%M%S)
echo "=== Backup current version to $BACKUP_DIR ==="
cp -r "$DEPLOY_DIR" "$BACKUP_DIR" 2>/dev/null || true

# 停止旧服务
echo "=== Stop old services ==="
pkill -f "green-worker-management-system-1.0.0-SNAPSHOT.jar" || true
pkill -f ".next/standalone/server.js" || true
sleep 3

# 构建并启动后端
echo "=== Build backend ==="
cd green-worker-management-system
mvn clean package -DskipTests
cd ..

echo "=== Start backend on 8081 ==="
nohup java -Dfile.encoding=UTF-8 \
  -Dspring.profiles.active=prod \
  -jar green-worker-management-system/target/green-worker-management-system-1.0.0-SNAPSHOT.jar \
  > backend.log 2>&1 &

sleep 15

# 构建并启动前端
echo "=== Build frontend ==="
cd landscape-admin-web
npm ci
npm run build
cd ..

echo "=== Start frontend on 3001 ==="
PORT=3001 nohup node landscape-admin-web/.next/standalone/server.js > frontend.log 2>&1 &

sleep 5

echo "=== Verify ports ==="
ss -tlnp 2>/dev/null | grep -E ':8081|:3001' || netstat -tlnp 2>/dev/null | grep -E ':8081|:3001' || true

echo "=== Deployment completed ==="
