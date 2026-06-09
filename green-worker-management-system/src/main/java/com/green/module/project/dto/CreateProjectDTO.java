package com.green.module.project.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 创建项目DTO
 */
@Data
public class CreateProjectDTO {

    @NotBlank(message = "项目标题不能为空")
    private String projectName;

    @NotNull(message = "男工一日营业额不能为空")
    @DecimalMin(value = "0.00", message = "营业额不能为负数")
    private BigDecimal maleDailyRevenue;

    @NotNull(message = "女工一日营业额不能为空")
    @DecimalMin(value = "0.00", message = "营业额不能为负数")
    private BigDecimal femaleDailyRevenue;

    @NotNull(message = "毛利率不能为空")
    @DecimalMin(value = "0.00", message = "毛利率不能为负数")
    @DecimalMax(value = "1.00", message = "毛利率不能超过1")
    private BigDecimal grossMargin;

    private String projectAddress;
    private LocalDate startDate;
    private LocalDate endDate;
}
