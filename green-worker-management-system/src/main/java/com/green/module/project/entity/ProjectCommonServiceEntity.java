package com.green.module.project.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.green.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

/**
 * 项目内常用服务实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("project_common_services")
public class ProjectCommonServiceEntity extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /** 项目ID */
    private Long projectId;

    /** 服务名称 */
    private String serviceName;

    /** 工人类型: 1-男工, 2-女工，null-空白 */
    private Integer workerType;

    /** 单价（元） */
    private BigDecimal unitPrice;
}
