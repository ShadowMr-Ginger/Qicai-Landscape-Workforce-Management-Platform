-- ============================================================
-- 迁移脚本：用「记录台账」替换「项目营业记录」
-- 说明：删除旧的项目营业记录表，新建 ledgers / ledger_items 表
-- 注意：此脚本会清空旧营业记录数据，已确认可接受
-- ============================================================

-- 1. 删除旧表
DROP TABLE IF EXISTS `project_revenue_record_items`;
DROP TABLE IF EXISTS `project_revenue_records`;

-- 2. 记录台账主表
CREATE TABLE IF NOT EXISTS `ledgers` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `project_id` BIGINT NOT NULL COMMENT '所属项目ID',
    `record_date` DATE NOT NULL COMMENT '台账日期',
    `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '台账总金额(元)',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人ID',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人ID',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted` INT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0-正常, 1-删除',
    `version` INT NOT NULL DEFAULT 1 COMMENT '版本号',
    PRIMARY KEY (`id`),
    KEY `idx_project_id` (`project_id`),
    KEY `idx_record_date` (`record_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='记录台账主表';

-- 3. 台账用工记录明细表
CREATE TABLE IF NOT EXISTS `ledger_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `ledger_id` BIGINT NOT NULL COMMENT '所属台账ID',
    `service_name` VARCHAR(100) NOT NULL COMMENT '服务名称',
    `worker_type` TINYINT DEFAULT NULL COMMENT '工人类型: 1-男工, 2-女工, null-未选择',
    `quantity` INT NOT NULL DEFAULT 1 COMMENT '数量',
    `unit_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '单价(元)',
    `total_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '总价(元)',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '显示顺序',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted` INT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0-正常, 1-删除',
    PRIMARY KEY (`id`),
    KEY `idx_ledger_id` (`ledger_id`),
    KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='台账用工记录明细表';
