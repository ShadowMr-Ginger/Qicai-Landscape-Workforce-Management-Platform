-- 为工人批次明细临时表增加考勤日期字段，并以所属批次的 batch_date 初始化历史数据
ALTER TABLE `attendance_batch_worker_items`
    ADD COLUMN `attendance_date` DATE NULL COMMENT '考勤日期（提交时默认批次日期，审核时可修改）' AFTER `project_id`;

UPDATE `attendance_batch_worker_items` w
    JOIN `attendance_batches` b ON w.batch_id = b.id
SET w.attendance_date = b.batch_date
WHERE w.attendance_date IS NULL;

ALTER TABLE `attendance_batch_worker_items`
    MODIFY COLUMN `attendance_date` DATE NOT NULL COMMENT '考勤日期（提交时默认批次日期，审核时可修改）';
