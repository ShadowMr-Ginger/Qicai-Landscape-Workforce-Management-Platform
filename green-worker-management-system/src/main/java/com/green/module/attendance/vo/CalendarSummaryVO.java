package com.green.module.attendance.vo;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 日历统计VO
 */
@Data
public class CalendarSummaryVO {

    /** 应结工资（总工资） */
    private BigDecimal totalWage;

    /** 已结工资 */
    private BigDecimal settledWage;

    /** 未结工资 */
    private BigDecimal unsettledWage;
}
