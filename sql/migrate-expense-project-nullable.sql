-- ============================================================
-- 开销记录模块 project_id 可空迁移
-- 说明: 允许开支项目和开销记录不绑定具体项目
-- ============================================================

ALTER TABLE `expense_items` MODIFY COLUMN `project_id` BIGINT DEFAULT NULL COMMENT '关联项目ID（可选）';
ALTER TABLE `expense_records` MODIFY COLUMN `project_id` BIGINT DEFAULT NULL COMMENT '关联项目ID（可选）';
