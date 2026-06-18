-- 删除司机表手机号唯一索引
-- 业务上允许多个司机不填手机号，也允许手机号重复
ALTER TABLE `drivers` DROP INDEX IF EXISTS `uk_phone`;
