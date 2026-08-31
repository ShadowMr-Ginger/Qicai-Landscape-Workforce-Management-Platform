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

# 确保已安装 PDF 导出所需的中文字体
INSTALL_FONTS=false
if command -v fc-list >/dev/null 2>&1; then
  if ! fc-list :lang=zh | grep -q .; then
    INSTALL_FONTS=true
  fi
else
  INSTALL_FONTS=true
fi

if [ "$INSTALL_FONTS" = true ]; then
  echo "=== Installing Chinese fonts for PDF export ==="
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update -qq
    apt-get install -y -qq fonts-noto-cjk fonts-wqy-zenhei fontconfig || true
  elif command -v yum >/dev/null 2>&1; then
    yum install -y google-noto-sans-cjk-fonts wqy-zenhei-fonts fontconfig || true
  fi
  fc-cache -f >/dev/null 2>&1 || true
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
