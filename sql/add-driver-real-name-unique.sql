-- 司机姓名唯一：司机端登录使用姓名，不能同名
-- 执行前请先清理重复的 real_name 记录
ALTER TABLE `drivers` ADD UNIQUE KEY `uk_real_name` (`real_name`);
