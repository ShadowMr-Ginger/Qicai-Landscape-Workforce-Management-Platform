-- ============================================================
-- 开销记录模块数据库迁移脚本
-- 说明: 为已有数据库新增开支项目、开销记录相关表
-- 注意: 请在目标库中直接执行
-- ============================================================

-- 15. 开支项目表 (expense_items)
CREATE TABLE IF NOT EXISTS `expense_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `project_id` BIGINT NOT NULL COMMENT '关联项目ID',
    `item_name` VARCHAR(100) NOT NULL COMMENT '开支项目名称',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '描述',
    `total_expense` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '总开销(元)',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人ID',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人ID',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` INT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0-未删除, 1-已删除',
    `version` INT NOT NULL DEFAULT 1 COMMENT '版本号',
    PRIMARY KEY (`id`),
    KEY `idx_project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='开支项目表';

-- 16. 开支项目常用主体表 (expense_item_common_subjects)
CREATE TABLE IF NOT EXISTS `expense_item_common_subjects` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `expense_item_id` BIGINT NOT NULL COMMENT '开支项目ID',
    `subject_name` VARCHAR(100) NOT NULL COMMENT '常用主体名称',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人ID',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人ID',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` INT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0-未删除, 1-已删除',
    `version` INT NOT NULL DEFAULT 1 COMMENT '版本号',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_expense_item_subject` (`expense_item_id`, `subject_name`, `deleted`),
    KEY `idx_expense_item_id` (`expense_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='开支项目常用主体表';

-- 17. 开支项目常用备注表 (expense_item_common_remarks)
CREATE TABLE IF NOT EXISTS `expense_item_common_remarks` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `expense_item_id` BIGINT NOT NULL COMMENT '开支项目ID',
    `remark_name` VARCHAR(255) NOT NULL COMMENT '常用备注',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人ID',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人ID',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` INT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0-未删除, 1-已删除',
    `version` INT NOT NULL DEFAULT 1 COMMENT '版本号',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_expense_item_remark` (`expense_item_id`, `remark_name`, `deleted`),
    KEY `idx_expense_item_id` (`expense_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='开支项目常用备注表';

-- 18. 开销记录主表 (expense_records)
CREATE TABLE IF NOT EXISTS `expense_records` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `project_id` BIGINT NOT NULL COMMENT '关联项目ID',
    `expense_item_id` BIGINT NOT NULL COMMENT '开支项目ID',
    `record_date` DATE NOT NULL COMMENT '记录日期',
    `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '总金额(元)',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人ID',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人ID',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` INT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0-未删除, 1-已删除',
    `version` INT NOT NULL DEFAULT 1 COMMENT '版本号',
    PRIMARY KEY (`id`),
    KEY `idx_project_id` (`project_id`),
    KEY `idx_expense_item_id` (`expense_item_id`),
    KEY `idx_record_date` (`record_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='开销记录主表';

-- 19. 开销记录明细表 (expense_record_items)
CREATE TABLE IF NOT EXISTS `expense_record_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `expense_record_id` BIGINT NOT NULL COMMENT '开销记录ID',
    `subject_name` VARCHAR(100) NOT NULL COMMENT '主体名称',
    `quantity` INT NOT NULL DEFAULT 1 COMMENT '数量',
    `unit_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '单价(元)',
    `total_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '总价(元)',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '显示顺序',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` INT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0-未删除, 1-已删除',
    PRIMARY KEY (`id`),
    KEY `idx_expense_record_id` (`expense_record_id`),
    KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='开销记录明细表';

-- 外键约束
ALTER TABLE `expense_items`
    ADD CONSTRAINT `fk_expense_items_project_id` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `expense_item_common_subjects`
    ADD CONSTRAINT `fk_eics_expense_item` FOREIGN KEY (`expense_item_id`) REFERENCES `expense_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `expense_item_common_remarks`
    ADD CONSTRAINT `fk_eicr_expense_item` FOREIGN KEY (`expense_item_id`) REFERENCES `expense_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `expense_records`
    ADD CONSTRAINT `fk_expense_records_project_id` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `fk_expense_records_expense_item_id` FOREIGN KEY (`expense_item_id`) REFERENCES `expense_items` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `expense_record_items`
    ADD CONSTRAINT `fk_expense_record_items_record_id` FOREIGN KEY (`expense_record_id`) REFERENCES `expense_records` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
