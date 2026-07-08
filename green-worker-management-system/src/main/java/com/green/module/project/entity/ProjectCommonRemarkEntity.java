package com.green.module.project.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.green.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 项目内常用备注实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("project_common_remarks")
public class ProjectCommonRemarkEntity extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /** 项目ID */
    private Long projectId;

    /** 备注名称 */
    private String remarkName;
}
