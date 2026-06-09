package com.green.module.project.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 项目视图对象
 */
@Data
public class ProjectVO {

    private Long id;

    private String projectName;

    private String projectAddress;

    private LocalDate startDate;

    private LocalDate endDate;

    private Integer status;

    private String statusText;

    private BigDecimal maleDailyRevenue;

    private BigDecimal femaleDailyRevenue;

    private BigDecimal grossMargin;

    private BigDecimal totalRevenue;

    private BigDecimal profit;

    private BigDecimal netProfit;

    private Integer isSystem;

    private String isSystemText;

    private Integer isClosed;

    private String isClosedText;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime closeTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;
}
