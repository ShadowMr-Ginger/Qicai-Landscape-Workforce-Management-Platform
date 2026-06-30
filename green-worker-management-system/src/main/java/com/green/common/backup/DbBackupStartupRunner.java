package com.green.common.backup;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * 应用启动时执行数据库备份
 * <p>
 * 在 Spring Boot 应用启动完成后立即触发一次全量备份，
 * 确保每次重新部署前都有可用的回滚点。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DbBackupStartupRunner implements ApplicationRunner {

    private final DbBackupService dbBackupService;
    private final DbBackupProperties properties;

    @Override
    public void run(ApplicationArguments args) {
        if (!properties.isEnabled() || !properties.isBackupOnStartup()) {
            log.info("[DbBackupStartupRunner] 启动备份已禁用");
            return;
        }

        log.info("[DbBackupStartupRunner] 应用启动完成，开始执行启动备份");
        dbBackupService.backup();
    }
}
