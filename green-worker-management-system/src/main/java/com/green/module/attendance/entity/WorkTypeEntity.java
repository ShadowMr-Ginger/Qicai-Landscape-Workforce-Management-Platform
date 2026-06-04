package com.green.module.attendance.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.green.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 作业类型实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("work_types")
public class WorkTypeEntity extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /** 作业类型名称 */
    private String typeName;

    /** 描述 */
    private String description;

    /** 是否启用: 1-启用, 0-禁用 */
    private Integer isActive;

    /** 排序序号 */
    private Integer sortOrder;

    /** 是否系统预设: 1-系统, 0-自定义 */
    private Integer isSystem;
}
