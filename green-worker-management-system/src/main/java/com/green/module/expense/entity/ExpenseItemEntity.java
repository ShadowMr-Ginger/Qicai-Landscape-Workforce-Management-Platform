package com.green.module.expense.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.green.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

/**
 * 开支项目实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("expense_items")
public class ExpenseItemEntity extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /** 关联项目ID */
    private Long projectId;

    /** 开支项目名称 */
    private String itemName;

    /** 描述 */
    private String description;

    /** 总开销(元) */
    private BigDecimal totalExpense;
}
