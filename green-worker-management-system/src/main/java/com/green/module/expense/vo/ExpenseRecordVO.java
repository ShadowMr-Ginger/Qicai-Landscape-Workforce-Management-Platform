package com.green.module.expense.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 开销记录 VO
 */
@Data
public class ExpenseRecordVO {

    private Long id;

    private Long projectId;

    private String projectName;

    private Long expenseItemId;

    private String expenseItemName;

    private LocalDate recordDate;

    private BigDecimal totalAmount;

    private Integer itemCount;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;

    private List<ExpenseRecordItemVO> items;

    @Data
    public static class ExpenseRecordItemVO {

        private Long id;

        private Long expenseRecordId;

        private String subjectName;

        private Integer quantity;

        private BigDecimal unitPrice;

        private BigDecimal totalPrice;

        private String remark;

        private Integer sortOrder;
    }
}
