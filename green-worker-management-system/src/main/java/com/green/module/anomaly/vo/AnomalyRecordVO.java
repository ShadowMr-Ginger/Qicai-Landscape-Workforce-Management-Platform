package com.green.module.anomaly.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 异常记录 VO
 */
@Data
public class AnomalyRecordVO {

    private Long id;

    /**
     * 异常类型: 1-重名, 2-重复考勤, 3-超长加班
     */
    private Integer type;

    /**
     * 异常类型文本
     */
    private String typeText;

    /**
     * 子类型: 1-工人, 2-司机
     */
    private Integer subType;

    /**
     * 子类型文本
     */
    private String subTypeText;

    /**
     * 状态: 0-未处理, 1-已处理
     */
    private Integer status;

    /**
     * 状态文本
     */
    private String statusText;

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
    private Long relatedId;

    /**
     * 次要关联ID
     */
    private Long relatedId2;

    /**
     * 关联日期
     */
    private LocalDate relatedDate;

    /**
     * 导航链接
     */
    private String linkUrl;

    /**
     * 处理时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime resolvedTime;

    /**
     * 处理人
     */
    private Long resolvedBy;

    /**
     * 处理人姓名
     */
    private String resolvedByName;

    /**
     * 创建时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;
}
