package com.green.module.expense.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.green.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 开支项目常用备注实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("expense_item_common_remarks")
public class ExpenseItemCommonRemarkEntity extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /** 开支项目ID */
    private Long expenseItemId;

    /** 常用备注 */
    private String remarkName;
}
