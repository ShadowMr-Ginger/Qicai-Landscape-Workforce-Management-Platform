package com.green.module.worker.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.green.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

/**
 * 工人类
 *
 * <p>对应数据库表 workers，存储工人的基本信息、薪资配置和在职状态。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("workers")
public class WorkerEntity extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 姓名
     */
    private String name;

    /**
     * 性别：1-男，2-女
     */
    private Integer gender;

    /**
     * 所属组别ID
     */
    @TableField("group_id")
    private Long groupId;

    /**
     * 手机号
     */
    private String phone;

    /**
     * 身份证号
     */
    @TableField("id_card")
    private String idCard;

    /**
     * 基础日薪（元）
     */
    @TableField("base_daily_salary")
    private BigDecimal baseDailySalary;

    /**
     * 加班时薪（元/小时）
     */
    @TableField("overtime_hourly_rate")
    private BigDecimal overtimeHourlyRate;

    /**
     * 紧急联系人电话
     */
    @TableField("emergency_contact_phone")
    private String emergencyContactPhone;

    /**
     * 是否技术工人：1-是，0-否
     */
    @TableField("is_skilled_worker")
    private Integer isSkilledWorker;

    /**
     * 是否在职：1-在职，0-离职
     */
    @TableField("is_employed")
    private Integer isEmployed;

    /**
     * 默认项目ID
     */
    @TableField("default_project_id")
    private Long defaultProjectId;

    /**
     * 创建人ID
     */
    @TableField("created_by")
    private Long createdBy;

    /**
     * 创建人类型：1-管理员，2-司机
     */
    @TableField("created_by_type")
    private Integer createdByType;
}
