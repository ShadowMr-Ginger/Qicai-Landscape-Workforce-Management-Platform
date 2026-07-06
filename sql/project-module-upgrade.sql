-- ============================================================
-- 项目管理模块升级脚本
-- 1. 营业额与考勤次数脱钩：projects 的男/女日营业额改为可空
-- 2. 新增营业记录表及明细表
-- 3. 新增常用服务名称表
-- 4. 司机考勤记录及批次临时表增加 project_id
-- ============================================================

-- 1. projects 表：男/女日营业额改为可空（历史数据保留）
ALTER TABLE `projects`
    MODIFY COLUMN `male_daily_revenue` DECIMAL(10,2) DEFAULT 0.00 COMMENT '男工一日营业额(元)（已弃用，保留兼容）',
    MODIFY COLUMN `female_daily_revenue` DECIMAL(10,2) DEFAULT 0.00 COMMENT '女工一日营业额(元)（已弃用，保留兼容）';

-- 2. 营业记录主表
CREATE TABLE IF NOT EXISTS `project_revenue_records` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `project_id` BIGINT NOT NULL COMMENT '所属项目ID',
    `record_date` DATE NOT NULL COMMENT '营业日期',
    `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '营业记录总金额(元)',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人ID',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人ID',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted` INT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0-正常, 1-删除',
    `version` INT NOT NULL DEFAULT 1 COMMENT '乐观锁版本号',
    PRIMARY KEY (`id`),
    KEY `idx_project_id` (`project_id`),
    KEY `idx_record_date` (`record_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目营业记录表';

-- 3. 营业记录明细表
CREATE TABLE IF NOT EXISTS `project_revenue_record_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `record_id` BIGINT NOT NULL COMMENT '所属营业记录ID',
    `service_name` VARCHAR(100) NOT NULL COMMENT '服务名称',
    `worker_type` TINYINT NOT NULL DEFAULT 1 COMMENT '工人类型: 1-男工, 2-女工',
    `quantity` INT NOT NULL DEFAULT 1 COMMENT '数量',
    `unit_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '单价(元)',
    `total_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '总价(元)',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_record_id` (`record_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目营业记录明细表';

-- 4. 常用服务名称表
CREATE TABLE IF NOT EXISTS `common_service_names` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `service_name` VARCHAR(100) NOT NULL COMMENT '服务名称',
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

-- 4.2 已有常用服务名称表补充 version 字段（兼容历史迁移）
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
