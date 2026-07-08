-- ============================================================
-- 项目管理模块升级脚本
-- 1. 营业额与考勤次数脱钩：projects 的男/女日营业额改为可空
-- 2. 常用服务名称表
-- 3. 司机考勤记录及批次临时表增加 project_id
-- 4. 项目内常用服务表
-- 注意：原 project_revenue_records / project_revenue_record_items 已废弃，
--       由 sql/migrate-to-ledger.sql 负责删除并创建 ledgers / ledger_items
-- ============================================================

-- 1. projects 表：男/女日营业额改为可空（历史数据保留）
ALTER TABLE `projects`
    MODIFY COLUMN `male_daily_revenue` DECIMAL(10,2) DEFAULT 0.00 COMMENT '男工一日营业额(元)（已弃用，保留兼容）',
    MODIFY COLUMN `female_daily_revenue` DECIMAL(10,2) DEFAULT 0.00 COMMENT '女工一日营业额(元)（已弃用，保留兼容）';

-- 2. 常用服务名称表
CREATE TABLE IF NOT EXISTS `common_service_names` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `service_name` VARCHAR(100) NOT NULL COMMENT '服务名称',
    `base_price` DECIMAL(10,2) DEFAULT NULL COMMENT '基础价格(元)',
    `is_system` TINYINT NOT NULL DEFAULT 0 COMMENT '是否系统预设: 0-否, 1-是',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人ID',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人ID',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted` INT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0-正常, 1-删除',
    PRIMARY KEY (`id`),
    KEY `idx_service_name` (`service_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='常用服务名称表';

-- 4.1 已有常用服务名称表补充 update_by 字段（兼容历史迁移）
SET @dbname = DATABASE();
SET @tablename = 'common_service_names';
SET @columnname = 'update_by';
SET @addUpdateBySql = (
    SELECT IF(
        (
            SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = @dbname
              AND TABLE_NAME = @tablename
              AND COLUMN_NAME = @columnname
        ) > 0,
        'SELECT 1;',
        "ALTER TABLE `common_service_names` ADD COLUMN `update_by` BIGINT DEFAULT NULL COMMENT '更新人ID' AFTER `create_by`;"
    )
);
PREPARE stmt FROM @addUpdateBySql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4.2 已有常用服务名称表补充 base_price 字段（兼容历史迁移）
SET @dbname = DATABASE();
SET @tablename = 'common_service_names';
SET @columnname = 'base_price';
SET @addBasePriceSql = (
    SELECT IF(
        (
            SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = @dbname
              AND TABLE_NAME = @tablename
              AND COLUMN_NAME = @columnname
        ) > 0,
        'SELECT 1;',
        "ALTER TABLE `common_service_names` ADD COLUMN `base_price` DECIMAL(10,2) DEFAULT NULL COMMENT '基础价格(元)' AFTER `service_name`;"
    )
);
PREPARE stmt FROM @addBasePriceSql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4.3 已有常用服务名称表补充 version 字段（兼容历史迁移）
SET @columnname = 'version';
SET @addVersionSql = (
    SELECT IF(
        (
            SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = @dbname
              AND TABLE_NAME = @tablename
              AND COLUMN_NAME = @columnname
        ) > 0,
        'SELECT 1;',
        "ALTER TABLE `common_service_names` ADD COLUMN `version` INT NOT NULL DEFAULT 1 COMMENT '乐观锁版本号' AFTER `deleted`;"
    )
);
PREPARE stmt FROM @addVersionSql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. 司机考勤记录表增加 project_id
SET @dbname = DATABASE();
SET @tablename = 'driver_attendance_records';
SET @columnname = 'project_id';
SET @addDriverProjectSql = (
    SELECT IF(
        (
            SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = @dbname
              AND TABLE_NAME = @tablename
              AND COLUMN_NAME = @columnname
        ) > 0,
        'SELECT 1;',
        "ALTER TABLE `driver_attendance_records` ADD COLUMN `project_id` BIGINT DEFAULT NULL COMMENT '关联项目ID' AFTER `driver_id`;"
    )
);
PREPARE stmt FROM @addDriverProjectSql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. 司机批次临时明细表增加 project_id
SET @tablename = 'attendance_batch_driver_items';
SET @addDriverItemProjectSql = (
    SELECT IF(
        (
            SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = @dbname
              AND TABLE_NAME = @tablename
              AND COLUMN_NAME = @columnname
        ) > 0,
        'SELECT 1;',
        "ALTER TABLE `attendance_batch_driver_items` ADD COLUMN `project_id` BIGINT DEFAULT NULL COMMENT '关联项目ID' AFTER `driver_id`;"
    )
);
PREPARE stmt FROM @addDriverItemProjectSql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 7. 项目内常用服务表
CREATE TABLE IF NOT EXISTS `project_common_services` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `project_id` BIGINT NOT NULL COMMENT '项目ID',
    `service_name` VARCHAR(100) NOT NULL COMMENT '服务名称',
    `worker_type` TINYINT DEFAULT NULL COMMENT '工人类型: 1-男工, 2-女工，null-空白',
    `unit_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '单价(元)',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人ID',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人ID',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted` INT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0-正常, 1-删除',
    `version` INT NOT NULL DEFAULT 1 COMMENT '乐观锁版本号',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_project_service` (`project_id`, `service_name`, `deleted`),
    KEY `idx_project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目内常用服务表';

-- 8. 项目内常用备注表
CREATE TABLE IF NOT EXISTS `project_common_remarks` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `project_id` BIGINT NOT NULL COMMENT '项目ID',
    `remark_name` VARCHAR(255) NOT NULL COMMENT '备注名称',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人ID',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人ID',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted` INT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0-正常, 1-删除',
    `version` INT NOT NULL DEFAULT 1 COMMENT '乐观锁版本号',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_project_remark` (`project_id`, `remark_name`, `deleted`),
    KEY `idx_project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目内常用备注表';
