package com.green.module.project.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.green.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 项目营业记录实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("project_revenue_records")
public class ProjectRevenueRecordEntity extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /** 所属项目ID */
    private Long projectId;

    /** 营业日期 */
    private LocalDate recordDate;

    /** 营业记录总金额 */
    private BigDecimal totalAmount;

    /** 备注 */
    private String remark;
}
