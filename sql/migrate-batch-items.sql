-- ============================================================
-- 迁移脚本：考勤批次明细拆分与唯一约束调整
-- 说明：
-- 1. 移除 worker_attendance_records / driver_attendance_records 的日期唯一约束
-- 2. 新增 attendance_batch_worker_items / attendance_batch_driver_items 临时明细表
-- ============================================================

-- 1. 移除工人考勤记录日期唯一约束（兼容 MySQL 8.0.12）
SET @idx_name = (SELECT INDEX_NAME FROM information_schema.STATISTICS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'worker_attendance_records'
                   AND INDEX_NAME = 'uk_worker_date'
                 LIMIT 1);
SET @drop_worker_idx = IF(@idx_name IS NOT NULL, 'ALTER TABLE `worker_attendance_records` DROP INDEX `uk_worker_date`', 'SELECT 1');
PREPARE stmt FROM @drop_worker_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. 司机表：先确保 driver_id 有独立索引（外键约束需要），再移除复合唯一索引
SET @driver_idx_name = (SELECT INDEX_NAME FROM information_schema.STATISTICS
                        WHERE TABLE_SCHEMA = DATABASE()
                          AND TABLE_NAME = 'driver_attendance_records'
                          AND INDEX_NAME = 'uk_driver_date'
                        LIMIT 1);
SET @add_driver_idx = IF(@driver_idx_name IS NOT NULL,
                         'ALTER TABLE `driver_attendance_records` ADD INDEX `idx_driver_id` (`driver_id`)',
                         'SELECT 1');
PREPARE stmt FROM @add_driver_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @drop_driver_idx = IF(@driver_idx_name IS NOT NULL, 'ALTER TABLE `driver_attendance_records` DROP INDEX `uk_driver_date`', 'SELECT 1');
PREPARE stmt FROM @drop_driver_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. 创建考勤批次工人明细临时表
CREATE TABLE IF NOT EXISTS `attendance_batch_worker_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `batch_id` BIGINT NOT NULL,
    `worker_id` BIGINT NOT NULL,
    `project_id` BIGINT DEFAULT NULL,
    `attendance_type` TINYINT NOT NULL DEFAULT 2,
    `overtime_hours` DECIMAL(3,1) NOT NULL DEFAULT 0.0,
    `work_type_id` BIGINT DEFAULT NULL,
    `daily_wage` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `overtime_wage` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `total_wage` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `remark` VARCHAR(500) DEFAULT NULL,
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_batch_id` (`batch_id`),
    KEY `idx_worker_id` (`worker_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 创建考勤批次司机明细临时表
CREATE TABLE IF NOT EXISTS `attendance_batch_driver_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `batch_id` BIGINT NOT NULL,
    `driver_id` BIGINT NOT NULL,
    `attendance_date` DATE NOT NULL,
    `attendance_type` TINYINT NOT NULL DEFAULT 2,
    `overtime_hours` DECIMAL(3,1) NOT NULL DEFAULT 0.0,
    `daily_wage` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `overtime_wage` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `total_wage` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `remark` VARCHAR(500) DEFAULT NULL,
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_batch_id` (`batch_id`),
    KEY `idx_driver_id` (`driver_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
