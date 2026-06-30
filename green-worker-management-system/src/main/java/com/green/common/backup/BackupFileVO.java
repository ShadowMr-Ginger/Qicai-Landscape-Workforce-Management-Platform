package com.green.common.backup;

import lombok.Data;

/**
 * 备份文件信息
 */
@Data
public class BackupFileVO {

    /**
     * 文件名
     */
    private String fileName;

    /**
     * 绝对路径
     */
    private String absolutePath;

    /**
     * 文件大小（字节）
     */
    private long sizeBytes;

    /**
     * 创建时间（ Asia/Shanghai 格式化字符串）
     */
    private String createdAt;
}
