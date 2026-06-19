-- 修复司机表手机号字段允许为空，避免新增司机时未填写手机号导致 "Field 'phone' doesn't have a default value" 系统内部错误
ALTER TABLE `drivers` MODIFY COLUMN `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号';
