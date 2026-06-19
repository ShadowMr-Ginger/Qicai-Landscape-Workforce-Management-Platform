-- ============================================================
-- 绿化工人管理系统 - MySQL 数据库初始化脚本
-- 版本: 1.0.0
-- 字符集: utf8mb4
-- 注意: 本脚本可直接执行，包含完整的表结构、索引、外键及初始数据
-- ============================================================

CREATE DATABASE IF NOT EXISTS `landscape_workforce` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `landscape_workforce`;

-- ============================================================
-- 1. 组别表 (groups)
-- 说明: 工人的分组信息，如"一组"、"二组"、"技术组"等
-- ============================================================
CREATE TABLE `groups` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `group_name` VARCHAR(50) NOT NULL COMMENT '组别名称',
    `description` VARCHAR(200) DEFAULT NULL COMMENT '组别描述',
    `is_system` TINYINT NOT NULL DEFAULT 0 COMMENT '是否系统组: 0-否, 1-是',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人ID',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人ID',
    `deleted` INT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0-未删除, 1-已删除',
    `version` INT NOT NULL DEFAULT 1 COMMENT '版本号',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_group_name` (`group_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='组别表';

-- ============================================================
-- 2. 工作类型表 (work_types)
-- 说明: 定义工人的工作类型，如"种植"、"修剪"、"浇水"、"运输"等
-- ============================================================
CREATE TABLE `work_types` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `type_name` VARCHAR(50) NOT NULL COMMENT '工作类型名称',
    `description` VARCHAR(200) DEFAULT NULL COMMENT '工作类型描述',
    `is_active` TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用: 1-启用, 0-禁用',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序序号',
    `is_system` TINYINT NOT NULL DEFAULT 0 COMMENT '是否系统类型: 0-否, 1-是',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人ID',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人ID',
    `deleted` INT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0-未删除, 1-已删除',
    `version` INT NOT NULL DEFAULT 1 COMMENT '版本号',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_type_name` (`type_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作类型表';

-- ============================================================
-- 3. 工地项目表 (projects)
-- 说明: 绿化工程项目信息，仅管理员可见和管理
-- ============================================================
CREATE TABLE `projects` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `project_name` VARCHAR(100) NOT NULL COMMENT '项目名称',
    `project_address` VARCHAR(200) DEFAULT NULL COMMENT '项目地址',
    `start_date` DATE DEFAULT NULL COMMENT '项目开始日期',
    `end_date` DATE DEFAULT NULL COMMENT '项目结束日期',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '项目状态: 1-进行中, 2-已结束',
    `male_daily_revenue` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '男工一日营业额(元)',
    `female_daily_revenue` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '女工一日营业额(元)',
    `gross_margin_rate` DECIMAL(5,4) NOT NULL DEFAULT 0.0000 COMMENT '毛利率(如0.2500=25%)',
    `total_revenue` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '项目总营业额(元)',
    `profit` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '利润(元)',
    `is_system` TINYINT NOT NULL DEFAULT 0 COMMENT '是否系统项目: 0-否, 1-是',
    `is_closed` TINYINT NOT NULL DEFAULT 0 COMMENT '是否已结项: 0-否, 1-是',
    `close_time` DATETIME DEFAULT NULL COMMENT '结项时间',
    `created_by` BIGINT NOT NULL COMMENT '创建人ID(管理员ID)',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_status` (`status`),
    KEY `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工地项目表';

-- ============================================================
-- 4. 管理员表 (admins)
-- 说明: 系统管理员/超级管理员(老板)，负责审核、项目管理、工资结算
-- ============================================================
CREATE TABLE `admins` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `username` VARCHAR(50) NOT NULL COMMENT '登录用户名',
    `password` VARCHAR(100) NOT NULL COMMENT '加密后的登录密码',
    `real_name` VARCHAR(50) DEFAULT NULL COMMENT '真实姓名',
    `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
    `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
    `role_type` TINYINT NOT NULL DEFAULT 1 COMMENT '角色类型: 1-超级管理员, 2-普通管理员(预留)',
    `is_active` TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用: 1-启用, 0-禁用',
    `last_login_time` DATETIME DEFAULT NULL COMMENT '最后登录时间',
    `last_login_ip` VARCHAR(50) DEFAULT NULL COMMENT '最后登录IP',
    `wx_openid` VARCHAR(100) DEFAULT NULL COMMENT '微信OpenID',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`),
    UNIQUE KEY `uk_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';

-- ============================================================
-- 5. 司机表 (drivers)
-- 说明: 司机使用微信小程序提交考勤，每天有固定全勤
-- ============================================================
CREATE TABLE `drivers` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `real_name` VARCHAR(50) NOT NULL COMMENT '姓名',
    `gender` TINYINT NOT NULL DEFAULT 1 COMMENT '性别: 1-男, 2-女',
    `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
    `id_card` VARCHAR(18) DEFAULT NULL COMMENT '身份证号',
    `emergency_contact_phone` VARCHAR(20) DEFAULT NULL COMMENT '紧急联系人电话',
    `base_daily_salary` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '基础日薪(元)',
    `overtime_hourly_rate` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '加班时薪(元/小时)',
    `wx_openid` VARCHAR(100) DEFAULT NULL COMMENT '微信OpenID',
    `wx_unionid` VARCHAR(100) DEFAULT NULL COMMENT '微信UnionID',
    `password` VARCHAR(100) NOT NULL COMMENT '登录密码(默认123456，加密存储)',
    `password_changed` TINYINT NOT NULL DEFAULT 0 COMMENT '是否已修改默认密码: 1-已修改, 0-未修改(首次登录必须修改)',
    `is_active` TINYINT NOT NULL DEFAULT 1 COMMENT '是否在职: 1-在职, 0-离职',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_real_name` (`real_name`),
    UNIQUE KEY `uk_wx_openid` (`wx_openid`),
    KEY `idx_is_active` (`is_active`),
    KEY `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='司机表';

-- ============================================================
-- 6. 工人表 (workers)
-- 说明: 工人由司机线下管理，不直接使用系统
-- ============================================================
CREATE TABLE `workers` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `name` VARCHAR(50) NOT NULL COMMENT '姓名',
    `gender` TINYINT NOT NULL DEFAULT 1 COMMENT '性别: 1-男, 2-女',
    `group_id` BIGINT NOT NULL DEFAULT 5 COMMENT '所属组别ID',
    `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
    `id_card` VARCHAR(18) DEFAULT NULL COMMENT '身份证号',
    `base_daily_salary` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '基础日薪(元)',
    `overtime_hourly_rate` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '加班时薪(元/小时)',
    `emergency_contact_phone` VARCHAR(20) DEFAULT NULL COMMENT '紧急联系人电话',
    `is_skilled_worker` TINYINT NOT NULL DEFAULT 0 COMMENT '是否技术工人: 1-是, 0-否',
    `is_employed` TINYINT NOT NULL DEFAULT 1 COMMENT '是否在职: 1-在职, 0-离职',
    `default_project_id` BIGINT DEFAULT NULL COMMENT '默认所属项目ID',
    `created_by` BIGINT DEFAULT NULL COMMENT '创建人ID',
    `created_by_type` TINYINT NOT NULL DEFAULT 1 COMMENT '创建人类型: 1-管理员, 2-司机',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_name` (`name`),
    KEY `idx_group_id` (`group_id`),
    KEY `idx_is_employed` (`is_employed`),
    KEY `idx_default_project_id` (`default_project_id`),
    KEY `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工人表';

-- ============================================================
-- 7. 司机常用工人表 (driver_favorite_workers)
-- 说明: 司机在小程序端可以快速选择自己常用的工人
-- ============================================================
CREATE TABLE `driver_favorite_workers` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `driver_id` BIGINT NOT NULL COMMENT '司机ID',
    `worker_id` BIGINT NOT NULL COMMENT '工人ID',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_driver_worker` (`driver_id`, `worker_id`),
    KEY `idx_driver_id` (`driver_id`),
    KEY `idx_worker_id` (`worker_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='司机常用工人表';

-- ============================================================
-- 8. 考勤批次表 (attendance_batches)
-- 说明: 司机每天提交的考勤批次，是审核的主体
-- 批次状态: 0-待审核, 1-已通过, 2-已撤回
-- ============================================================
CREATE TABLE `attendance_batches` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `driver_id` BIGINT NOT NULL COMMENT '提交司机ID',
    `batch_date` DATE NOT NULL COMMENT '考勤日期',
    `status` TINYINT NOT NULL DEFAULT 0 COMMENT '批次状态: 0-待审核, 1-已通过, 2-已撤回, 3-不通过',
    `submit_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间',
    `review_time` DATETIME DEFAULT NULL COMMENT '审核时间',
    `reviewer_id` BIGINT DEFAULT NULL COMMENT '审核人ID(管理员ID)',
    `total_workers` INT NOT NULL DEFAULT 0 COMMENT '批次内工人数量',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_driver_id` (`driver_id`),
    KEY `idx_batch_date` (`batch_date`),
    KEY `idx_status` (`status`),
    KEY `idx_driver_date` (`driver_id`, `batch_date`),
    KEY `idx_reviewer_id` (`reviewer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考勤批次表';

-- ============================================================
-- 9. 工人考勤记录表 (worker_attendance_records)
-- 说明: 工人的每日考勤记录，审核通过后由批次明细写入
-- 核心约束: 允许一个工人同一天存在多条考勤记录，用于异常检测
-- 工资冗余字段: 审核时计算并写入，避免重复计算
-- ============================================================
CREATE TABLE `worker_attendance_records` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `batch_id` BIGINT DEFAULT NULL COMMENT '来源考勤批次ID（用于追溯）',
    `driver_id` BIGINT DEFAULT NULL COMMENT '审核司机ID',
    `worker_id` BIGINT NOT NULL COMMENT '工人ID',
    `project_id` BIGINT DEFAULT NULL COMMENT '分配的项目ID(审核时确定)',
    `attendance_date` DATE NOT NULL COMMENT '考勤日期',
    `attendance_type` TINYINT NOT NULL DEFAULT 2 COMMENT '出勤类型: 1-半天, 2-全天',
    `overtime_hours` DECIMAL(3,1) NOT NULL DEFAULT 0.0 COMMENT '加班时长(小时，0.5小时粒度)',
    `work_type_id` BIGINT DEFAULT NULL COMMENT '工作类型ID',
    `daily_wage` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '当日基础工资(元)，审核时计算写入',
    `overtime_wage` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '当日加班工资(元)，审核时计算写入',
    `total_wage` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '当日总工资(元)，审核时计算写入',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `is_settled` TINYINT NOT NULL DEFAULT 0 COMMENT '是否已结清: 1-已结清, 0-未结清',
    `settled_time` DATETIME DEFAULT NULL COMMENT '结清时间',
    `settled_by` BIGINT DEFAULT NULL COMMENT '结清操作人ID',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_batch_id` (`batch_id`),
    KEY `idx_worker_id` (`worker_id`),
    KEY `idx_project_id` (`project_id`),
    KEY `idx_attendance_date` (`attendance_date`),
    KEY `idx_work_type_id` (`work_type_id`),
    KEY `idx_is_settled` (`is_settled`),
    KEY `idx_batch_worker` (`batch_id`, `worker_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工人考勤记录表';

-- ============================================================
-- 10. 司机考勤记录表 (driver_attendance_records)
-- 说明: 司机的每日考勤记录，审核通过后由批次明细写入
-- 工资冗余字段: 系统生成时计算并写入
-- ============================================================
CREATE TABLE `driver_attendance_records` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `driver_id` BIGINT NOT NULL COMMENT '司机ID',
    `attendance_date` DATE NOT NULL COMMENT '考勤日期',
    `attendance_type` TINYINT NOT NULL DEFAULT 2 COMMENT '出勤类型: 固定2-全天',
    `overtime_hours` DECIMAL(3,1) NOT NULL DEFAULT 0.0 COMMENT '加班时长(小时，0.5小时粒度)',
    `work_type_id` BIGINT DEFAULT NULL COMMENT '工作类型ID',
    `daily_wage` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '当日基础工资(元)',
    `overtime_wage` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '当日加班工资(元)',
    `total_wage` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '当日总工资(元)',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `is_settled` TINYINT NOT NULL DEFAULT 0 COMMENT '是否已结清: 1-已结清, 0-未结清',
    `settled_time` DATETIME DEFAULT NULL COMMENT '结清时间',
    `settled_by` BIGINT DEFAULT NULL COMMENT '结清操作人ID',
    `source_batch_id` BIGINT DEFAULT NULL COMMENT '关联的工人考勤批次ID(用于追溯)',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_attendance_date` (`attendance_date`),
    KEY `idx_work_type_id` (`work_type_id`),
    KEY `idx_is_settled` (`is_settled`),
    KEY `idx_source_batch_id` (`source_batch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='司机考勤记录表';

-- ============================================================
-- 10.1 考勤批次工人明细临时表 (attendance_batch_worker_items)
-- 说明: 保存待审核/已撤回批次中的工人考勤明细，审核通过后写入 worker_attendance_records
-- ============================================================
CREATE TABLE `attendance_batch_worker_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `batch_id` BIGINT NOT NULL COMMENT '所属考勤批次ID',
    `worker_id` BIGINT NOT NULL COMMENT '工人ID',
    `project_id` BIGINT DEFAULT NULL COMMENT '分配的项目ID',
    `attendance_type` TINYINT NOT NULL DEFAULT 2 COMMENT '出勤类型: 1-半天, 2-全天',
    `overtime_hours` DECIMAL(3,1) NOT NULL DEFAULT 0.0 COMMENT '加班时长(小时，0.5小时粒度)',
    `work_type_id` BIGINT DEFAULT NULL COMMENT '工作类型ID',
    `daily_wage` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '当日基础工资(元)',
    `overtime_wage` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '当日加班工资(元)',
    `total_wage` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '当日总工资(元)',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_batch_id` (`batch_id`),
    KEY `idx_worker_id` (`worker_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考勤批次工人明细临时表';

-- ============================================================
-- 10.2 考勤批次司机明细临时表 (attendance_batch_driver_items)
-- 说明: 保存待审核/已撤回批次中的司机考勤明细，审核通过后写入 driver_attendance_records
-- ============================================================
CREATE TABLE `attendance_batch_driver_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `batch_id` BIGINT NOT NULL COMMENT '所属考勤批次ID',
    `driver_id` BIGINT NOT NULL COMMENT '司机ID',
    `attendance_date` DATE NOT NULL COMMENT '考勤日期',
    `attendance_type` TINYINT NOT NULL DEFAULT 2 COMMENT '出勤类型: 固定2-全天',
    `overtime_hours` DECIMAL(3,1) NOT NULL DEFAULT 0.0 COMMENT '加班时长(小时，0.5小时粒度)',
    `daily_wage` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '当日基础工资(元)',
    `overtime_wage` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '当日加班工资(元)',
    `total_wage` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '当日总工资(元)',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_batch_id` (`batch_id`),
    KEY `idx_driver_id` (`driver_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考勤批次司机明细临时表';

-- ============================================================
-- 11. 系统配置表 (system_configs)
-- 说明: 存储系统级配置参数
-- ============================================================
CREATE TABLE `system_configs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `config_key` VARCHAR(100) NOT NULL COMMENT '配置键',
    `config_value` TEXT COMMENT '配置值',
    `description` VARCHAR(200) DEFAULT NULL COMMENT '配置描述',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- ============================================================
-- 12. 操作日志表 (operation_logs)
-- 说明: 记录所有关键操作，包括工资发放、批次审核、数据修改等
-- 不单独建工资发放表，工资发放通过此表记录
-- ============================================================
CREATE TABLE `operation_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `operator_type` TINYINT NOT NULL COMMENT '操作者类型: 1-管理员, 2-司机',
    `operator_id` BIGINT NOT NULL COMMENT '操作者ID',
    `operator_name` VARCHAR(50) DEFAULT NULL COMMENT '操作者姓名',
    `operation_module` VARCHAR(50) NOT NULL COMMENT '操作模块: BATCH/WORKER/DRIVER/WAGE/PROJECT/SYSTEM等',
    `operation_type` VARCHAR(50) NOT NULL COMMENT '操作类型: CREATE/UPDATE/DELETE/REVIEW/SETTLE/WITHDRAW等',
    `operation_desc` VARCHAR(500) NOT NULL COMMENT '操作描述',
    `business_id` BIGINT DEFAULT NULL COMMENT '业务主键ID(如批次ID、工人ID等)',
    `business_type` VARCHAR(50) DEFAULT NULL COMMENT '业务类型',
    `request_params` TEXT COMMENT '请求参数(JSON格式)',
    `response_result` TEXT COMMENT '响应结果(精简)',
    `ip_address` VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',
    `user_agent` VARCHAR(500) DEFAULT NULL COMMENT '用户代理',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_operator` (`operator_type`, `operator_id`),
    KEY `idx_operation_module` (`operation_module`),
    KEY `idx_operation_type` (`operation_type`),
    KEY `idx_business_id` (`business_id`),
    KEY `idx_created_at` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- ============================================================
-- 13. 系统日志表 (system_logs)
-- 说明: 记录管理员/司机的关键操作，用于审计和故障排查
-- ============================================================
CREATE TABLE `system_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_type` VARCHAR(20) NOT NULL COMMENT '用户类型: ADMIN-管理员, DRIVER-司机',
    `user_id` BIGINT DEFAULT NULL COMMENT '用户ID',
    `user_name` VARCHAR(50) DEFAULT NULL COMMENT '用户姓名',
    `action` VARCHAR(50) NOT NULL COMMENT '操作类型',
    `target_type` VARCHAR(50) DEFAULT NULL COMMENT '操作对象类型',
    `target_id` BIGINT DEFAULT NULL COMMENT '操作对象ID',
    `detail` VARCHAR(1000) DEFAULT NULL COMMENT '详细内容',
    `ip_address` VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',
    `result` VARCHAR(20) NOT NULL COMMENT '操作结果: SUCCESS-成功, FAIL-失败',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人ID',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人ID',
    `deleted` INT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0-未删除, 1-已删除',
    `version` INT NOT NULL DEFAULT 1 COMMENT '版本号',
    PRIMARY KEY (`id`),
    KEY `idx_user_type` (`user_type`),
    KEY `idx_action` (`action`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统日志表';

-- ============================================================
-- 14. 异常记录表 (anomaly_records)
-- 说明: 存储系统检测到的各类异常，供管理员人工复核处理
-- ============================================================
CREATE TABLE `anomaly_records` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `type` TINYINT NOT NULL COMMENT '异常类型: 1-重名, 2-重复考勤, 3-超长加班',
    `sub_type` TINYINT DEFAULT NULL COMMENT '子类型: 1-工人, 2-司机',
    `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0-未处理, 1-已处理',
    `title` VARCHAR(200) NOT NULL COMMENT '异常标题',
    `description` VARCHAR(500) DEFAULT NULL COMMENT '异常描述',
    `related_id` BIGINT DEFAULT NULL COMMENT '主要关联ID',
    `related_id2` BIGINT DEFAULT NULL COMMENT '次要关联ID',
    `related_date` DATE DEFAULT NULL COMMENT '关联日期',
    `link_url` VARCHAR(255) DEFAULT NULL COMMENT '导航链接',
    `resolved_time` DATETIME DEFAULT NULL COMMENT '处理时间',
    `resolved_by` BIGINT DEFAULT NULL COMMENT '处理人ID',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除标志',
    `version` INT NOT NULL DEFAULT 0 COMMENT '乐观锁版本号',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人ID',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人ID',
    PRIMARY KEY (`id`),
    KEY `idx_type_status` (`type`, `status`),
    KEY `idx_related` (`related_id`, `related_date`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='异常记录表';

-- ============================================================
-- 外键约束（在表创建后添加，避免依赖问题）
-- ============================================================

-- 工人表外键
ALTER TABLE `workers`
    ADD CONSTRAINT `fk_workers_group_id` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `fk_workers_default_project` FOREIGN KEY (`default_project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- 项目表外键
ALTER TABLE `projects`
    ADD CONSTRAINT `fk_projects_created_by` FOREIGN KEY (`created_by`) REFERENCES `admins` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 司机常用工人表外键
ALTER TABLE `driver_favorite_workers`
    ADD CONSTRAINT `fk_dfw_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `fk_dfw_worker` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 考勤批次表外键
ALTER TABLE `attendance_batches`
    ADD CONSTRAINT `fk_ab_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `fk_ab_reviewer` FOREIGN KEY (`reviewer_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- 工人考勤记录表外键
ALTER TABLE `worker_attendance_records`
    ADD CONSTRAINT `fk_war_batch` FOREIGN KEY (`batch_id`) REFERENCES `attendance_batches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `fk_war_worker` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `fk_war_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `fk_war_work_type` FOREIGN KEY (`work_type_id`) REFERENCES `work_types` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- 司机考勤记录表外键
ALTER TABLE `driver_attendance_records`
    ADD CONSTRAINT `fk_dar_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `fk_dar_work_type` FOREIGN KEY (`work_type_id`) REFERENCES `work_types` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `fk_dar_source_batch` FOREIGN KEY (`source_batch_id`) REFERENCES `attendance_batches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- 初始数据插入
-- ============================================================

-- 1. 插入默认管理员 (密码: 123456，使用 BCrypt 加密后的示例值)
-- 注意: 生产环境请重新生成密码
INSERT INTO `admins` (`username`, `password`, `real_name`, `phone`, `role_type`, `is_active`) VALUES
('admin', '$2b$10$9VU6HH87JmmG6Mh6ZcgvR.anONPjdDiyEFE.6mA4sHpRMgRkmRB3.', '管理员', '13800138000', 1, 1);

-- 2. 插入默认工作类型
INSERT INTO `work_types` (`type_name`, `description`, `sort_order`, `is_active`) VALUES
('种植', '绿化种植作业', 1, 1),
('修剪', '绿植修剪养护', 2, 1),
('浇水', '绿植浇水养护', 3, 1),
('施肥', '土壤施肥作业', 4, 1),
('除草', '杂草清除作业', 5, 1),
('运输', '苗木及物料运输', 6, 1),
('打药', '病虫害防治', 7, 1),
('保洁', '场地清洁维护', 8, 1),
('其他', '其他工作类型', 99, 1);

-- 3. 插入默认组别
INSERT INTO `groups` (`group_name`, `description`) VALUES
('一组', '第一施工组'),
('二组', '第二施工组'),
('三组', '第三施工组'),
('技术组', '技术工种组');

-- 4. 插入系统配置
INSERT INTO `system_configs` (`config_key`, `config_value`, `description`) VALUES
('system.name', '绿化工人管理系统', '系统名称'),
('system.version', '1.0.0', '系统版本'),
('wage.overtime_unit', '0.5', '加班时长最小粒度(小时)'),
('wage.default_driver_password', '123456', '司机默认密码(明文记录用于重置，实际存储已加密)'),
('batch.max_workers_per_batch', '50', '单个批次最大工人数'),
('batch.allow_withdraw_hours', '24', '批次提交后允许撤回的小时数(0表示无限制，仅未审核前)');

-- ============================================================
-- 索引设计说明（注释形式记录，便于DBA审核）
-- ============================================================

/*
【核心索引说明】

1. UK: worker_attendance_records 已移除 worker_id + attendance_date 唯一约束
   - 业务允许一个工人同一天存在多条考勤记录
   - 重复考勤由异常检测功能识别并提醒

2. UK: driver_attendance_records 已移除 driver_id + attendance_date 唯一约束
   - 业务允许一个司机同一天存在多条考勤记录

3. UK: attendance_batches 无日期+司机唯一索引
   - 业务允许一个司机同一天提交多个批次（前一个被撤回后可重新提交）
   - 所以不设置 driver_id + batch_date 唯一索引

4. IDX: worker_attendance_records.idx_batch_id
   - 高频查询：根据批次查询所有工人考勤记录

5. IDX: worker_attendance_records.idx_is_settled + idx_worker_id
   - 高频查询：查询某工人未结清的工资记录

6. IDX: driver_attendance_records.idx_is_settled + idx_driver_id
   - 高频查询：查询某司机未结清的工资记录

7. IDX: attendance_batches.idx_driver_date
   - 高频查询：司机查看自己某日期范围内的批次记录

8. IDX: operation_logs.idx_operator / idx_operation_module / idx_business_id
   - 日志查询高频条件，支持按操作人、模块、业务ID快速检索
*/
