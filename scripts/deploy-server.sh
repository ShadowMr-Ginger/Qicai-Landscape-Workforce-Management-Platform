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
sudo systemctl stop qicai-backend qicai-frontend || true
sleep 5

# 确保旧 Java 进程完全退出，释放 jar 文件句柄
echo "=== Ensure backend process stopped ==="
sudo pkill -f 'green-worker-management-system-1.0.0-SNAPSHOT.jar' || true
sleep 5
ps aux | grep 'green-worker-management-system-1.0.0-SNAPSHOT.jar' | grep -v grep || echo 'Backend process stopped'

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
sudo systemctl start qicai-backend
sleep 15
sudo systemctl start qicai-frontend
sleep 5

echo "=== Verify ports ==="
ss -tlnp 2>/dev/null | grep -E ':8081|:3001' || netstat -tlnp 2>/dev/null | grep -E ':8081|:3001' || true

echo "=== Deployment completed ==="
