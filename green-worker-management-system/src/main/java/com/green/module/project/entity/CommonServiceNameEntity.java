package com.green.module.project.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.green.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

/**
 * 常用服务名称实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("common_service_names")
public class CommonServiceNameEntity extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /** 服务名称 */
    private String serviceName;

    /** 基础价格（元） */
    private BigDecimal basePrice;

    /** 是否系统预设: 0-否, 1-是 */
    private Integer isSystem;
}
