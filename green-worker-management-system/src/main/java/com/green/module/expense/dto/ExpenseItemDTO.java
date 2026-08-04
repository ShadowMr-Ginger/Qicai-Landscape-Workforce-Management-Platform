package com.green.module.expense.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 开支项目保存/更新 DTO
 */
@Data
public class ExpenseItemDTO {

    private Long id;

    @NotNull(message = "关联项目不能为空")
    private Long projectId;

    @NotEmpty(message = "开支项目名称不能为空")
    private String itemName;

    private String description;

    @Data
    public static class CommonSubjectDTO {

        private Long id;

        @NotEmpty(message = "主体名称不能为空")
        private String subjectName;
    }

    @Data
    public static class CommonRemarkDTO {

        private Long id;

        @NotEmpty(message = "备注不能为空")
        private String remarkName;
    }
}
