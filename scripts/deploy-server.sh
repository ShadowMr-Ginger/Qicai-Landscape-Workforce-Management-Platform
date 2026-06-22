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

# 停止服务
echo "=== Stop services ==="
systemctl stop qicai-backend qicai-frontend || true
sleep 3

# 构建后端
echo "=== Build backend ==="
cd green-worker-management-system
mvn clean package -DskipTests
cd ..

# 构建前端
echo "=== Build frontend ==="
cd landscape-admin-web
npm ci
npm run build
cd ..

# 启动服务
echo "=== Start services ==="
systemctl start qicai-backend
sleep 15
systemctl start qicai-frontend
sleep 5

echo "=== Verify ports ==="
ss -tlnp 2>/dev/null | grep -E ':8081|:3001' || netstat -tlnp 2>/dev/null | grep -E ':8081|:3001' || true

echo "=== Deployment completed ==="
