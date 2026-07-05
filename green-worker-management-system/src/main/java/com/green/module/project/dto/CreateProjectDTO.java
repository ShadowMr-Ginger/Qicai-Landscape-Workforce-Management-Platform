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

    @NotNull(message = "毛利率不能为空")
    @DecimalMin(value = "0.00", message = "毛利率不能为负数")
    @DecimalMax(value = "1.00", message = "毛利率不能超过1")
    private BigDecimal grossMargin;

    private String projectAddress;

    @NotNull(message = "开始日期不能为空")
    private LocalDate startDate;

    /**
     * 结束日期（创建时不需要，结项时写入）
     */
    private LocalDate endDate;

    /**
     * 已弃用：男工一日营业额，保留字段兼容旧数据
     */
    @Deprecated
    private BigDecimal maleDailyRevenue;

    /**
     * 已弃用：女工一日营业额，保留字段兼容旧数据
     */
    @Deprecated
    private BigDecimal femaleDailyRevenue;
}
