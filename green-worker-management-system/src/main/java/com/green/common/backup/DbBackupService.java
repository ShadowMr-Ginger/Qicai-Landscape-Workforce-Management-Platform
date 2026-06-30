package com.green.common.backup;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 数据库备份服务
 * <p>
 * 使用 mysqldump 对 MySQL 数据库进行逻辑备份，并自动清理过期备份文件。
 * 备份信息从 Spring 数据源配置中读取，避免重复维护环境变量。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DbBackupService {

    private static final DateTimeFormatter FILE_NAME_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");
    private static final Pattern JDBC_URL_PATTERN = Pattern.compile(
            "jdbc:mysql://([^:/]+)(?::(\\d+))?/([^?]+)(?:\\?.*)?");

    private final DbBackupProperties properties;
    private final DataSourceProperties dataSourceProperties;

    private String host = "localhost";
    private int port = 3306;
    private String database = "landscape_workforce";

    @PostConstruct
    public void init() {
        if (!properties.isEnabled()) {
            log.info("[DbBackup] 数据库自动备份已禁用");
            return;
        }

        parseDataSourceUrl(dataSourceProperties.getUrl());

        File dir = new File(properties.getBackupDir());
        if (!dir.exists() && !dir.mkdirs()) {
            log.error("[DbBackup] 无法创建备份目录：{}，请检查权限", properties.getBackupDir());
            return;
        }

        log.info("[DbBackup] 备份服务已初始化，数据库：{}@{}:{}，目录：{}，保留时长：{}，mysqldump：{}",
                database, host, port, properties.getBackupDir(), properties.getRetention(), properties.getMysqldumpPath());
    }

    /**
     * 执行一次数据库备份，并在成功后清理过期备份。
     *
     * @return 备份文件对象，若失败返回 null
     */
    public File backup() {
        if (!properties.isEnabled()) {
            log.info("[DbBackup] 备份已禁用，跳过执行");
            return null;
        }

        File dir = ensureBackupDir();
        if (dir == null) {
            return null;
        }

        String timestamp = LocalDateTime.now().format(FILE_NAME_FORMATTER);
        String fileName = properties.getFilePrefix() + "_" + timestamp + ".sql";
        File backupFile = new File(dir, fileName);

        List<String> command = buildCommand(backupFile);
        log.info("[DbBackup] 开始备份数据库 {} 到 {}", database, backupFile.getAbsolutePath());

        ProcessBuilder pb = new ProcessBuilder(command);
        pb.redirectErrorStream(true);
        pb.directory(dir);

        try {
            Process process = pb.start();
            String output = readStream(process);
            boolean finished = process.waitFor(10, TimeUnit.MINUTES);

            if (!finished) {
                process.destroyForcibly();
                log.error("[DbBackup] 备份进程超时，输出：{}", output);
                return null;
            }

            if (process.exitValue() != 0) {
                log.error("[DbBackup] 备份失败，退出码：{}，输出：{}", process.exitValue(), output);
                return null;
            }

            long size = backupFile.length();
            log.info("[DbBackup] 备份成功：{}，大小：{} bytes", backupFile.getAbsolutePath(), size);

            cleanupOldBackups();
            return backupFile;
        } catch (IOException | InterruptedException e) {
            log.error("[DbBackup] 备份执行异常", e);
            Thread.currentThread().interrupt();
            return null;
        }
    }

    /**
     * 清理超过保留时长的备份文件。
     */
    public void cleanupOldBackups() {
        File dir = new File(properties.getBackupDir());
        if (!dir.exists() || !dir.isDirectory()) {
            return;
        }

        long retentionMillis = properties.getRetention().toMillis();
        long now = System.currentTimeMillis();
        File[] files = dir.listFiles((d, name) ->
                name.startsWith(properties.getFilePrefix()) && name.endsWith(".sql"));

        if (files == null || files.length == 0) {
            return;
        }

        int deleted = 0;
        for (File file : files) {
            if (now - file.lastModified() > retentionMillis) {
                if (file.delete()) {
                    deleted++;
                    log.info("[DbBackup] 已删除过期备份：{}", file.getName());
                } else {
                    log.warn("[DbBackup] 删除过期备份失败：{}", file.getName());
                }
            }
        }

        if (deleted > 0) {
            log.info("[DbBackup] 共清理 {} 个过期备份文件", deleted);
        }
    }

    /**
     * 列出当前备份目录下的所有备份文件，按修改时间倒序排列。
     */
    public List<File> listBackups() {
        File dir = new File(properties.getBackupDir());
        File[] files = dir.listFiles((d, name) ->
                name.startsWith(properties.getFilePrefix()) && name.endsWith(".sql"));

        if (files == null) {
            return new ArrayList<>();
        }

        return Arrays.stream(files)
                .sorted(Comparator.comparingLong(File::lastModified).reversed())
                .toList();
    }

    private void parseDataSourceUrl(String url) {
        if (url == null || url.isBlank()) {
            log.warn("[DbBackup] 未配置数据源 URL，使用默认数据库：{}@{}:{}", database, host, port);
            return;
        }

        Matcher matcher = JDBC_URL_PATTERN.matcher(url);
        if (matcher.matches()) {
            this.host = matcher.group(1);
            if (matcher.group(2) != null) {
                this.port = Integer.parseInt(matcher.group(2));
            }
            this.database = matcher.group(3);
        } else {
            log.warn("[DbBackup] 无法解析数据源 URL：{}，使用默认值", url);
        }
    }

    private List<String> buildCommand(File backupFile) {
        List<String> command = new ArrayList<>();
        command.add(properties.getMysqldumpPath());
        command.add("-h" + host);
        command.add("-P" + port);
        command.add("-u" + dataSourceProperties.getUsername());

        String password = dataSourceProperties.getPassword();
        if (password != null && !password.isEmpty()) {
            command.add("-p" + password);
        }

        if (properties.getExtraOptions() != null && !properties.getExtraOptions().isEmpty()) {
            command.addAll(Arrays.asList(properties.getExtraOptions().split("\\s+")));
        }

        command.add("--result-file=" + backupFile.getAbsolutePath());
        command.add(database);
        return command;
    }

    private File ensureBackupDir() {
        File dir = new File(properties.getBackupDir());
        if (!dir.exists() && !dir.mkdirs()) {
            log.error("[DbBackup] 无法创建备份目录：{}，请检查权限", properties.getBackupDir());
            return null;
        }
        return dir;
    }

    private String readStream(Process process) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append(System.lineSeparator());
            }
        }
        return sb.toString();
    }
}
