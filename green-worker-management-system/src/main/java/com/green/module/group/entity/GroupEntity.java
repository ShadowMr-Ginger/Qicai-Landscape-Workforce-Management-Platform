package com.green.module.group.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.green.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 组别实体
 *
 * @author Green Team
 * @version 1.0.0
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("groups")
public class GroupEntity extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 组别名称
     */
    private String groupName;

    /**
     * 描述
     */
    private String description;
}
