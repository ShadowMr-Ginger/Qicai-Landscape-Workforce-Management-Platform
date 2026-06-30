# Agent 协作说明

## 数据库安全与重新部署

1. **重新部署不会删除或修改现有数据库数据**。当前部署流程仅替换后端 jar 包与前端产物，并重启服务，不会自动执行 `init-schema.sql` 或其他可能破坏数据的脚本。
2. **数据库初始化脚本 `sql/init-schema.sql` 仅用于全新环境初始化**，不应在已有数据的服务器上直接执行。
3. **生产环境所有敏感配置（数据库密码、JWT 密钥、微信密钥）均通过 `/home/deploy/qicai/.env` 注入**，由 systemd 服务 `EnvironmentFile` 加载，避免硬编码在代码或配置文件中。

## 数据库自动备份

后端已集成基于 `mysqldump` 的自动备份能力。

### 行为

- **启动备份**：应用启动完成后自动执行一次全量备份。
- **定时备份**：默认每 12 小时执行一次（`00:00`、`12:00`），Cron 表达式可在 `application-prod.yml` 中调整。
- **保留策略**：默认保留 7 天，超期自动清理。

### 配置（`application-prod.yml`）

```yaml
green:
  backup:
    enabled: true
    mysqldump-path: /usr/bin/mysqldump
    backup-dir: /home/deploy/qicai/backups
    file-prefix: landscape_workforce
    backup-on-startup: true
    scheduled-enabled: true
    cron: "0 0 0/12 * * ?"
    retention: 7d
    extra-options: "--single-transaction --routines --events --triggers"
```

### 管理接口

仅 ADMIN 角色可访问：

- `POST /api/admin/db-backup/backup-now` — 手动触发备份
- `GET /api/admin/db-backup/list` — 查看备份列表
- `POST /api/admin/db-backup/cleanup` — 立即清理过期备份

### 部署注意事项

- 部署脚本 `scripts/deploy-server.sh` 会自动创建 `/home/deploy/qicai/backups` 目录。
- 生产环境需确保 `mysqldump` 路径正确，并且应用进程对该目录有写入权限。
- 备份文件为纯 SQL，可使用标准 MySQL 客户端恢复：`mysql -u root -p landscape_workforce < backup_file.sql`。
