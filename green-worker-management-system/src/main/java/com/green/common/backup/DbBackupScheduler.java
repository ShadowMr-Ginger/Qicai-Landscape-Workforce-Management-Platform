package com.green.common.backup;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 数据库备份定时任务
 * <p>
 * 按照配置中的 Cron 表达式周期性地执行数据库备份。
 * 默认每 12 小时执行一次（00:00、12:00）。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DbBackupScheduler {

    private final DbBackupService dbBackupService;
    private final DbBackupProperties properties;

    @Scheduled(cron = "${green.backup.cron:0 0 0/12 * * ?}")
    public void scheduledBackup() {
        if (!properties.isEnabled() || !properties.isScheduledEnabled()) {
            log.info("[DbBackupScheduler] 定时备份已禁用，跳过本次执行");
            return;
        }

        log.info("[DbBackupScheduler] 定时备份任务触发");
        dbBackupService.backup();
    }
}
