package com.green.module.attendance.vo;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 月度考勤表 - 单日的工资与加班信息
 */
@Data
public class MonthlyReportDayVO {

    /**
     * 日期（1-31）
     */
    private Integer day;

    /**
     * 当日基础出勤工资（已按半天/全天折算）
     */
    private BigDecimal wage;

    /**
     * 当日加班时长（小时）
     */
    private BigDecimal overtimeHours;

    /**
     * 当日是否为空（未记载）
     */
    private boolean empty;
}
