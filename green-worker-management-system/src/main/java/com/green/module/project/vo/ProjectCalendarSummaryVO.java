package com.green.module.project.vo;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 项目日历汇总数据VO
 */
@Data
public class ProjectCalendarSummaryVO {

    /** 当月总营业额 */
    private BigDecimal totalRevenue;

    /** 当月总利润 */
    private BigDecimal totalProfit;

    /** 当月总待付工资 */
    private BigDecimal totalPayableWage;

    /** 当月总净利润 */
    private BigDecimal totalNetProfit;
}
