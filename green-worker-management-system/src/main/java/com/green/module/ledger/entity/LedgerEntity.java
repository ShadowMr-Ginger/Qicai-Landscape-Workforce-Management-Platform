package com.green.module.ledger.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.green.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 记录台账主表实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("ledgers")
public class LedgerEntity extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /** 所属项目ID */
    private Long projectId;

    /** 台账日期 */
    private LocalDate recordDate;

    /** 台账总金额(元) */
    private BigDecimal totalAmount;
}
