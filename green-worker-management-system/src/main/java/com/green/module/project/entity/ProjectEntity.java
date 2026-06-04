package com.green.module.project.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.green.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

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
     * 项目名称
     */
    private String projectName;

    /**
     * 项目地址
     */
    private String projectAddress;

    /**
     * 开始日期
     */
    private LocalDate startDate;

    /**
     * 结束日期
     */
    private LocalDate endDate;

    /**
     * 项目状态：1-进行中，2-已结束
     */
    private Integer status;

    /**
     * 创建人ID
     */
    private Long createdBy;
}
