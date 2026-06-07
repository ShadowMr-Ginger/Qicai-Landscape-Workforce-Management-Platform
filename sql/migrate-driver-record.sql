-- 2024-06-07 司机考勤记录改造迁移脚本
-- 适用场景：已有数据库需要支持审核页面展示司机记录、批次备注只落入司机记录

-- 1. 工人考勤记录表增加审核司机ID字段
ALTER TABLE `worker_attendance_records`
    ADD COLUMN IF NOT EXISTS `driver_id` BIGINT DEFAULT NULL COMMENT '审核司机ID' AFTER `batch_id`;

-- 2. 工人考勤记录表的批次ID改为可空（审核通过后会解绑）
ALTER TABLE `worker_attendance_records`
    MODIFY COLUMN `batch_id` BIGINT DEFAULT NULL COMMENT '所属考勤批次ID（审核通过后解绑）';

-- 3. 外键改为 ON DELETE SET NULL，避免删除批次时误删工人记录
ALTER TABLE `worker_attendance_records`
    DROP FOREIGN KEY IF EXISTS `fk_war_batch`;
ALTER TABLE `worker_attendance_records`
    ADD CONSTRAINT `fk_war_batch` FOREIGN KEY (`batch_id`) REFERENCES `attendance_batches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. 批次状态注释更新
ALTER TABLE `attendance_batches`
    MODIFY COLUMN `status` TINYINT NOT NULL DEFAULT 0 COMMENT '批次状态: 0-待审核, 1-已通过, 2-已撤回, 3-不通过';

-- 5. 回填已有工人记录的 driver_id（从关联批次获取）
UPDATE `worker_attendance_records` war
    INNER JOIN `attendance_batches` ab ON war.batch_id = ab.id
    SET war.driver_id = ab.driver_id
WHERE war.driver_id IS NULL;
