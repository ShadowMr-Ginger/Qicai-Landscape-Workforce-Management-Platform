package com.green.module.project.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.green.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 项目实体
 *
 * @author Green Team
 * @version 1.0.0
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("projects")
public class ProjectEntity extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 项目标题
     */
    @TableField("project_name")
    private String projectName;

    /**
     * 项目地址
     */
    @TableField("project_address")
    private String projectAddress;

    /**
     * 开始日期
     */
    @TableField("start_date")
    private LocalDate startDate;

    /**
     * 结束日期
     */
    @TableField("end_date")
    private LocalDate endDate;

    /**
     * 项目状态：1-进行中，2-已结束
     */
    private Integer status;

    /**
     * 男工一日营业额
     */
    @TableField("male_daily_revenue")
    private BigDecimal maleDailyRevenue;

    /**
     * 女工一日营业额
     */
    @TableField("female_daily_revenue")
    private BigDecimal femaleDailyRevenue;

    /**
     * 毛利率(如0.25=25%)
     */
    @TableField("gross_margin_rate")
    private BigDecimal grossMargin;

    /**
     * 项目总营业额
     */
    @TableField("total_revenue")
    private BigDecimal totalRevenue;

    /**
     * 利润
     */
    private BigDecimal profit;

    /**
     * 是否系统项目：0-否，1-是
     */
    @TableField("is_system")
    private Integer isSystem;

    /**
     * 是否已结项：0-否，1-是
     */
    @TableField("is_closed")
    private Integer isClosed;

    /**
     * 结项时间
     */
    @TableField("close_time")
    private LocalDateTime closeTime;

    /**
     * 创建人ID
     */
    @TableField("created_by")
    private Long createdBy;
}
