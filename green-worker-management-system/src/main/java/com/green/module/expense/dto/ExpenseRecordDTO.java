package com.green.module.expense.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * 开销记录保存/更新 DTO
 */
@Data
public class ExpenseRecordDTO {

    private Long id;

    @NotNull(message = "项目不能为空")
    private Long projectId;

    @NotNull(message = "开支项目不能为空")
    private Long expenseItemId;

    @NotNull(message = "记录日期不能为空")
    private LocalDate recordDate;

    @NotEmpty(message = "请至少添加一条单项开支")
    private List<@Valid ExpenseRecordItemDTO> items;

    @Data
    public static class ExpenseRecordItemDTO {

        private Long id;

        @NotEmpty(message = "主体名称不能为空")
        private String subjectName;

        @NotNull(message = "数量不能为空")
        @Min(value = 1, message = "数量至少为1")
        private Integer quantity;

        @NotNull(message = "单价不能为空")
        @Min(value = 0, message = "单价不能为负数")
        private BigDecimal unitPrice;

        private String remark;
    }
}
