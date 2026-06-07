package com.green.module.system.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.green.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 系统日志实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("system_logs")
public class SystemLogEntity extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /** 用户类型: ADMIN-管理员, DRIVER-司机 */
    private String userType;

    /** 用户ID */
    private Long userId;

    /** 用户姓名 */
    private String userName;

    /** 操作类型 */
    private String action;

    /** 操作对象类型 */
    private String targetType;

    /** 操作对象ID */
    private Long targetId;

    /** 详细内容 */
    private String detail;

    /** IP地址 */
    private String ipAddress;

    /** 操作结果: SUCCESS-成功, FAIL-失败 */
    private String result;
}
