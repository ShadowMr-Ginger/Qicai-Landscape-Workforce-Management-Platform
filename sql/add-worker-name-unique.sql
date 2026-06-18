-- 工人姓名唯一：避免新增同名工人时信息被覆盖
-- 执行前请先清理重复的 name 记录
ALTER TABLE `workers` ADD UNIQUE KEY `uk_name` (`name`);
