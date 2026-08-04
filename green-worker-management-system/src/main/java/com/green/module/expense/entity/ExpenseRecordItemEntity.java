package com.green.module.expense.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 开销记录明细实体
 */
@Data
@TableName("expense_record_items")
public class ExpenseRecordItemEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /** 开销记录ID */
    private Long expenseRecordId;

    /** 主体名称 */
    private String subjectName;

    /** 数量 */
    private Integer quantity;

    /** 单价(元) */
    private BigDecimal unitPrice;

    /** 总价(元) */
    private BigDecimal totalPrice;

    /** 备注 */
    private String remark;

    /** 显示顺序 */
    private Integer sortOrder;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    @JsonIgnore
    private Integer deleted;
}
