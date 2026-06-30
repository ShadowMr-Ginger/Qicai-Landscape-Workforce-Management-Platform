package com.green.common.backup;

import com.green.common.result.ApiResult;
import com.green.common.result.ResultCodeEnum;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * 数据库备份管理接口
 * <p>
 * 供管理员手动触发备份或查看备份列表，仅允许 ADMIN 角色访问。
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/db-backup")
@RequiredArgsConstructor
public class DbBackupController {

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter
            .ofPattern("yyyy-MM-dd HH:mm:ss")
            .withZone(ZoneId.of("Asia/Shanghai"));

    private final DbBackupService dbBackupService;

    /**
     * 手动触发一次数据库备份。
     */
    @PostMapping("/backup-now")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResult<BackupFileVO> backupNow() {
        File file = dbBackupService.backup();
        if (file == null) {
            return ApiResult.error(ResultCodeEnum.INTERNAL_SERVER_ERROR, "备份失败，请检查后端日志");
        }
        return ApiResult.success(toVO(file));
    }

    /**
     * 获取当前备份目录下的所有备份文件列表（按时间倒序）。
     */
    @GetMapping("/list")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResult<List<BackupFileVO>> listBackups() {
        List<File> files = dbBackupService.listBackups();
        return ApiResult.success(files.stream().map(this::toVO).toList());
    }

    /**
     * 立即清理过期备份文件。
     */
    @PostMapping("/cleanup")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResult<Void> cleanup() {
        dbBackupService.cleanupOldBackups();
        return ApiResult.success();
    }

    private BackupFileVO toVO(File file) {
        BackupFileVO vo = new BackupFileVO();
        vo.setFileName(file.getName());
        vo.setAbsolutePath(file.getAbsolutePath());
        vo.setSizeBytes(file.length());
        vo.setCreatedAt(TIME_FORMATTER.format(Instant.ofEpochMilli(file.lastModified())));
        return vo;
    }
}
