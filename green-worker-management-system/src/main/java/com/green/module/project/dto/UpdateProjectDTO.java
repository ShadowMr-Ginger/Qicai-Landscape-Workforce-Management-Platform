package com.green.module.project.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 修改项目DTO
 */
@Data
public class UpdateProjectDTO {

    private String projectName;

    @DecimalMin(value = "0.00", message = "营业额不能为负数")
    private BigDecimal maleDailyRevenue;

    @DecimalMin(value = "0.00", message = "营业额不能为负数")
    private BigDecimal femaleDailyRevenue;

    @DecimalMin(value = "0.00", message = "毛利率不能为负数")
    @DecimalMax(value = "1.00", message = "毛利率不能超过1")
    private BigDecimal grossMargin;

    private String projectAddress;
    private LocalDate startDate;
    private LocalDate endDate;
}
