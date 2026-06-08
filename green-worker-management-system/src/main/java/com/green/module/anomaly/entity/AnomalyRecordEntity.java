package com.green.module.anomaly.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.green.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 异常记录实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("anomaly_records")
public class AnomalyRecordEntity extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 异常类型: 1-重名, 2-重复考勤, 3-超长加班
     */
    private Integer type;

    /**
     * 子类型: 1-工人, 2-司机
     */
    @TableField("sub_type")
    private Integer subType;

    /**
     * 状态: 0-未处理, 1-已处理
     */
    private Integer status;

    /**
     * 异常标题
     */
    private String title;

    /**
     * 异常描述
     */
    private String description;

    /**
     * 主要关联ID
     */
    @TableField("related_id")
    private Long relatedId;

    /**
     * 次要关联ID
     */
    @TableField("related_id2")
    private Long relatedId2;

    /**
     * 关联日期
     */
    @TableField("related_date")
    private LocalDate relatedDate;

    /**
     * 导航链接
     */
    @TableField("link_url")
    private String linkUrl;

    /**
     * 处理时间
     */
    @TableField("resolved_time")
    private LocalDateTime resolvedTime;

    /**
     * 处理人
     */
    @TableField("resolved_by")
    private Long resolvedBy;
}
