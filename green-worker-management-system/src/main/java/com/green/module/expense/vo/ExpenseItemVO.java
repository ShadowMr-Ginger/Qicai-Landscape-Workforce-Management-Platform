package com.green.module.expense.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 开支项目 VO
 */
@Data
public class ExpenseItemVO {

    private Long id;

    private Long projectId;

    private String projectName;

    private String itemName;

    private String description;

    private BigDecimal totalExpense;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;

    private List<CommonSubjectVO> commonSubjects;

    private List<CommonRemarkVO> commonRemarks;

    @Data
    public static class CommonSubjectVO {

        private Long id;

        private Long expenseItemId;

        private String subjectName;

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime createTime;
    }

    @Data
    public static class CommonRemarkVO {

        private Long id;

        private Long expenseItemId;

        private String remarkName;

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime createTime;
    }
}
