package com.green.module.attendance.vo;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 工资汇总统计VO（工人和司机共用）
 */
@Data
public class WageSummaryVO {

    /** 总共尚未结清的工资 */
    private BigDecimal totalUnsettled;

    /** 本年度需结清工资（自开工日起到今天所有工资） */
    private BigDecimal yearTotal;

    /** 本年度已结清工资 */
    private BigDecimal yearSettled;

    /** 本年度未结清工资 */
    private BigDecimal yearUnsettled;

    /** 历来未结清工资（开工日之前未结清的工资） */
    private BigDecimal historicalUnsettled;

    /** 本年度出勤总天数（半天=0.5，全天=1） */
    private BigDecimal yearAttendanceDays;

    /** 本年度加班总时数 */
    private BigDecimal yearOvertimeHours;

    /** 本月出勤总天数（半天=0.5，全天=1） */
    private BigDecimal monthAttendanceDays;

    /** 本月加班总时数 */
    private BigDecimal monthOvertimeHours;
}
