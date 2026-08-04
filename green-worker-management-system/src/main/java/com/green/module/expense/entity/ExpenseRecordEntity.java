package com.green.module.expense.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.green.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 开销记录主表实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("expense_records")
public class ExpenseRecordEntity extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /** 关联项目ID */
    private Long projectId;

    /** 开支项目ID */
    private Long expenseItemId;

    /** 记录日期 */
    private LocalDate recordDate;

    /** 总金额(元) */
    private BigDecimal totalAmount;
}
