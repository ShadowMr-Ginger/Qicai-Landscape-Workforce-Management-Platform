package com.green.common.backup;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * 数据库备份配置属性
 * <p>
 * 配置项前缀：green.backup
 */
@Data
@Component
@ConfigurationProperties(prefix = "green.backup")
public class DbBackupProperties {

    /**
     * 是否启用自动备份（包含启动备份与定时备份）
     */
    private boolean enabled = true;

    /**
     * mysqldump 可执行文件路径
     * <p>Linux 默认：/usr/bin/mysqldump；Windows 请配置为实际路径</p>
     */
    private String mysqldumpPath = "mysqldump";

    /**
     * 备份文件存放目录（绝对路径）
     * <p>生产环境建议配置为独立磁盘或挂载目录，如 /home/deploy/qicai/backups</p>
     */
    private String backupDir = "./backups";

    /**
     * 备份文件名前缀
     */
    private String filePrefix = "landscape_workforce";

    /**
     * 是否启动时立即执行一次备份
     */
    private boolean backupOnStartup = true;

    /**
     * 是否启用定时备份
     */
    private boolean scheduledEnabled = true;

    /**
     * 定时备份 Cron 表达式，默认每 12 小时执行一次（00:00、12:00）
     */
    private String cron = "0 0 0/12 * * ?";

    /**
     * 备份文件保留时长，默认 7 天
     */
    private Duration retention = Duration.ofDays(7);

    /**
     * mysqldump 额外参数，如 --single-transaction、--routines、--events 等
     */
    private String extraOptions = "--single-transaction --routines --events --triggers";
}
