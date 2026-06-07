package com.green.module.system.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.green.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 系统配置实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("system_configs")
public class SystemConfigEntity extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /** 配置键 */
    private String configKey;

    /** 配置值 */
    private String configValue;

    /** 配置描述 */
    private String description;
}
