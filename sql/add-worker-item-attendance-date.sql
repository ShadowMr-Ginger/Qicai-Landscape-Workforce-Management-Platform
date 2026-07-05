-- 为工人批次明细临时表增加考勤日期字段，并以所属批次的 batch_date 初始化历史数据
-- 幂等：列已存在时跳过 ADD COLUMN
SET @dbname = DATABASE();
SET @tablename = 'attendance_batch_worker_items';
SET @columnname = 'attendance_date';
SET @addColumnSql = (
    SELECT IF(
        (
            SELECT COUNT(*)
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = @dbname
              AND TABLE_NAME = @tablename
              AND COLUMN_NAME = @columnname
        ) > 0,
        'SELECT 1;',
        "ALTER TABLE `attendance_batch_worker_items`
            ADD COLUMN `attendance_date` DATE NULL COMMENT '考勤日期（提交时默认批次日期，审核时可修改）' AFTER `project_id`;"
    )
);
PREPARE addColumnStmt FROM @addColumnSql;
EXECUTE addColumnStmt;
DEALLOCATE PREPARE addColumnStmt;

-- 回填历史数据（未设置 attendance_date 的记录使用批次日期）
UPDATE `attendance_batch_worker_items` w
    JOIN `attendance_batches` b ON w.batch_id = b.id
SET w.attendance_date = b.batch_date
WHERE w.attendance_date IS NULL;

-- 将字段改为非空（仅当当前仍是 NULL 可空时才修改，避免重复部署报错）
SET @modifyNullableSql = (
    SELECT IF(
        (
            SELECT IS_NULLABLE
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = @dbname
              AND TABLE_NAME = @tablename
              AND COLUMN_NAME = @columnname
        ) = 'NO',
        'SELECT 1;',
        "ALTER TABLE `attendance_batch_worker_items`
            MODIFY COLUMN `attendance_date` DATE NOT NULL COMMENT '考勤日期（提交时默认批次日期，审核时可修改）';"
    )
);
PREPARE modifyNullableStmt FROM @modifyNullableSql;
EXECUTE modifyNullableStmt;
DEALLOCATE PREPARE modifyNullableStmt;
