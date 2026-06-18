-- 修复 projects 表缺少 gross_margin_rate 字段的问题
-- 适用场景：已执行过旧版 migrate-project-redesign.sql（其中使用了 gross_margin 而非 gross_margin_rate）的数据库

USE landscape_workforce;

-- 如果 gross_margin_rate 不存在则添加
SET @ddl = (
  SELECT CASE 
    WHEN COUNT(*) = 0 THEN 
      'ALTER TABLE `projects` ADD COLUMN `gross_margin_rate` DECIMAL(5,4) NOT NULL DEFAULT 0 COMMENT ''毛利率(0-1)'''
    ELSE 'SELECT 1'
  END
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'projects'
    AND column_name = 'gross_margin_rate'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 清理旧版中可能存在的错误列名 gross_margin（如存在且业务未使用）
SET @ddl2 = (
  SELECT CASE 
    WHEN COUNT(*) > 0 THEN 
      'ALTER TABLE `projects` DROP COLUMN `gross_margin`'
    ELSE 'SELECT 1'
  END
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'projects'
    AND column_name = 'gross_margin'
);

PREPARE stmt2 FROM @ddl2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
