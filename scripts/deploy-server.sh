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

# 创建数据库备份目录（后端启动备份时需要写入该目录）
BACKUP_DIR=/home/deploy/qicai/backups
if [ ! -d "$BACKUP_DIR" ]; then
  echo "=== Creating database backup directory: $BACKUP_DIR ==="
  mkdir -p "$BACKUP_DIR"
  chmod 755 "$BACKUP_DIR"
fi

# 停止服务
echo "=== Stop services ==="
systemctl stop qicai-backend qicai-frontend || true
sleep 5

# 确保旧进程完全退出，释放文件句柄
echo "=== Ensure old processes stopped ==="
pkill -f 'green-worker-management-system-1.0.0-SNAPSHOT.jar' || true
pkill -f '.next/standalone/server.js' || true
sleep 5

# 启动服务（产物已由 GitHub Actions 上传并解压）
echo "=== Start backend ==="
systemctl start qicai-backend
sleep 15

echo "=== Start frontend ==="
systemctl start qicai-frontend
sleep 5

echo "=== Verify ports ==="
ss -tlnp 2>/dev/null | grep -E ':8081|:3001' || netstat -tlnp 2>/dev/null | grep -E ':8081|:3001' || true

echo "=== Deployment completed ==="
