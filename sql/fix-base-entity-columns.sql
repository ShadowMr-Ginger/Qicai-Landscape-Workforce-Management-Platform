-- ============================================================
-- 修复：统一表结构以匹配 BaseEntity（create_time/update_time/create_by/update_by/deleted/version）
-- ============================================================

USE `landscape_workforce`;

-- 1. 重命名时间字段
ALTER TABLE `groups` CHANGE `created_at` `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE `groups` CHANGE `updated_at` `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `groups` ADD COLUMN `create_by` BIGINT DEFAULT NULL AFTER `create_time`;
ALTER TABLE `groups` ADD COLUMN `update_by` BIGINT DEFAULT NULL AFTER `create_by`;
ALTER TABLE `groups` ADD COLUMN `deleted` INT NOT NULL DEFAULT 0 AFTER `update_by`;
ALTER TABLE `groups` ADD COLUMN `version` INT NOT NULL DEFAULT 1 AFTER `deleted`;

ALTER TABLE `work_types` CHANGE `created_at` `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE `work_types` ADD COLUMN `create_by` BIGINT DEFAULT NULL AFTER `create_time`;
ALTER TABLE `work_types` ADD COLUMN `update_by` BIGINT DEFAULT NULL AFTER `create_by`;
ALTER TABLE `work_types` ADD COLUMN `deleted` INT NOT NULL DEFAULT 0 AFTER `update_by`;
ALTER TABLE `work_types` ADD COLUMN `version` INT NOT NULL DEFAULT 1 AFTER `deleted`;
ALTER TABLE `work_types` ADD COLUMN `update_time` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `version`;

ALTER TABLE `projects` CHANGE `created_at` `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE `projects` CHANGE `updated_at` `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `projects` ADD COLUMN `create_by` BIGINT DEFAULT NULL AFTER `create_time`;
ALTER TABLE `projects` ADD COLUMN `update_by` BIGINT DEFAULT NULL AFTER `create_by`;
ALTER TABLE `projects` ADD COLUMN `deleted` INT NOT NULL DEFAULT 0 AFTER `update_by`;
ALTER TABLE `projects` ADD COLUMN `version` INT NOT NULL DEFAULT 1 AFTER `deleted`;

ALTER TABLE `admins` CHANGE `created_at` `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE `admins` CHANGE `updated_at` `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `admins` ADD COLUMN `create_by` BIGINT DEFAULT NULL AFTER `create_time`;
ALTER TABLE `admins` ADD COLUMN `update_by` BIGINT DEFAULT NULL AFTER `create_by`;
ALTER TABLE `admins` ADD COLUMN `deleted` INT NOT NULL DEFAULT 0 AFTER `update_by`;
ALTER TABLE `admins` ADD COLUMN `version` INT NOT NULL DEFAULT 1 AFTER `deleted`;

ALTER TABLE `drivers` CHANGE `created_at` `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE `drivers` CHANGE `updated_at` `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `drivers` ADD COLUMN `create_by` BIGINT DEFAULT NULL AFTER `create_time`;
ALTER TABLE `drivers` ADD COLUMN `update_by` BIGINT DEFAULT NULL AFTER `create_by`;
ALTER TABLE `drivers` ADD COLUMN `deleted` INT NOT NULL DEFAULT 0 AFTER `update_by`;
ALTER TABLE `drivers` ADD COLUMN `version` INT NOT NULL DEFAULT 1 AFTER `deleted`;

ALTER TABLE `workers` CHANGE `created_at` `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE `workers` CHANGE `updated_at` `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `workers` ADD COLUMN `create_by` BIGINT DEFAULT NULL AFTER `create_time`;
ALTER TABLE `workers` ADD COLUMN `update_by` BIGINT DEFAULT NULL AFTER `create_by`;
ALTER TABLE `workers` ADD COLUMN `deleted` INT NOT NULL DEFAULT 0 AFTER `update_by`;
ALTER TABLE `workers` ADD COLUMN `version` INT NOT NULL DEFAULT 1 AFTER `deleted`;

ALTER TABLE `driver_favorite_workers` CHANGE `created_at` `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE `driver_favorite_workers` ADD COLUMN `create_by` BIGINT DEFAULT NULL AFTER `create_time`;
ALTER TABLE `driver_favorite_workers` ADD COLUMN `update_by` BIGINT DEFAULT NULL AFTER `create_by`;
ALTER TABLE `driver_favorite_workers` ADD COLUMN `deleted` INT NOT NULL DEFAULT 0 AFTER `update_by`;
ALTER TABLE `driver_favorite_workers` ADD COLUMN `version` INT NOT NULL DEFAULT 1 AFTER `deleted`;
ALTER TABLE `driver_favorite_workers` ADD COLUMN `update_time` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `version`;

ALTER TABLE `attendance_batches` CHANGE `created_at` `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE `attendance_batches` CHANGE `updated_at` `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `attendance_batches` ADD COLUMN `create_by` BIGINT DEFAULT NULL AFTER `create_time`;
ALTER TABLE `attendance_batches` ADD COLUMN `update_by` BIGINT DEFAULT NULL AFTER `create_by`;
ALTER TABLE `attendance_batches` ADD COLUMN `deleted` INT NOT NULL DEFAULT 0 AFTER `update_by`;
ALTER TABLE `attendance_batches` ADD COLUMN `version` INT NOT NULL DEFAULT 1 AFTER `deleted`;

ALTER TABLE `worker_attendance_records` CHANGE `created_at` `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE `worker_attendance_records` CHANGE `updated_at` `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `worker_attendance_records` ADD COLUMN `create_by` BIGINT DEFAULT NULL AFTER `create_time`;
ALTER TABLE `worker_attendance_records` ADD COLUMN `update_by` BIGINT DEFAULT NULL AFTER `create_by`;
ALTER TABLE `worker_attendance_records` ADD COLUMN `deleted` INT NOT NULL DEFAULT 0 AFTER `update_by`;
ALTER TABLE `worker_attendance_records` ADD COLUMN `version` INT NOT NULL DEFAULT 1 AFTER `deleted`;

ALTER TABLE `driver_attendance_records` CHANGE `created_at` `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE `driver_attendance_records` CHANGE `updated_at` `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `driver_attendance_records` ADD COLUMN `create_by` BIGINT DEFAULT NULL AFTER `create_time`;
ALTER TABLE `driver_attendance_records` ADD COLUMN `update_by` BIGINT DEFAULT NULL AFTER `create_by`;
ALTER TABLE `driver_attendance_records` ADD COLUMN `deleted` INT NOT NULL DEFAULT 0 AFTER `update_by`;
ALTER TABLE `driver_attendance_records` ADD COLUMN `version` INT NOT NULL DEFAULT 1 AFTER `deleted`;

ALTER TABLE `system_configs` CHANGE `created_at` `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE `system_configs` CHANGE `updated_at` `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `system_configs` ADD COLUMN `create_by` BIGINT DEFAULT NULL AFTER `create_time`;
ALTER TABLE `system_configs` ADD COLUMN `update_by` BIGINT DEFAULT NULL AFTER `create_by`;
ALTER TABLE `system_configs` ADD COLUMN `deleted` INT NOT NULL DEFAULT 0 AFTER `update_by`;
ALTER TABLE `system_configs` ADD COLUMN `version` INT NOT NULL DEFAULT 1 AFTER `deleted`;

-- operation_logs 不继承 BaseEntity，保持 created_at（与 LogEntity.createdAt 对应）
