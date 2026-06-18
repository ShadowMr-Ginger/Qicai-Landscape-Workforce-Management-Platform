-- 项目表字段扩充迁移脚本
-- 执行前请确保已备份数据库

USE landscape_workforce;

-- 1. 添加新的业务字段
ALTER TABLE `projects` 
  ADD COLUMN `male_daily_revenue` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '男工一日营业额',
  ADD COLUMN `female_daily_revenue` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '女工一日营业额',
  ADD COLUMN `gross_margin_rate` DECIMAL(5,4) NOT NULL DEFAULT 0 COMMENT '毛利率(0-1)',
  ADD COLUMN `total_revenue` DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT '项目总营业额',
  ADD COLUMN `profit` DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT '利润',
  ADD COLUMN `is_system` TINYINT NOT NULL DEFAULT 0 COMMENT '是否系统项目: 0-否, 1-是',
  ADD COLUMN `is_closed` TINYINT NOT NULL DEFAULT 0 COMMENT '是否已结项: 0-否, 1-是',
  ADD COLUMN `close_time` DATETIME DEFAULT NULL COMMENT '结项时间';

-- 2. 更新现有默认项目
UPDATE `projects` SET `is_system` = 1, `is_closed` = 0 WHERE `project_name` = '默认';
UPDATE `projects` SET `is_system` = 1, `is_closed` = 0 WHERE `id` = 6;

-- 3. 给所有非默认项目设置 is_closed 基于 status
UPDATE `projects` SET `is_closed` = CASE WHEN `status` = 2 THEN 1 ELSE 0 END WHERE `is_system` = 0;
