package com.green.module.attendance.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 日历某天考勤详情VO
 */
@Data
public class CalendarDetailVO {

    private Long recordId;
    private LocalDate attendanceDate;
    private String attendanceTypeText;
    private BigDecimal overtimeHours;
    private BigDecimal dailyWage;
    private BigDecimal overtimeWage;
    private BigDecimal totalWage;
    private String remark;
    private String isSettledText;

    /** 考勤员（司机） */
    private String driverName;

    /** 作业类型 */
    private String workTypeName;

    /** 工地/项目 */
    private String projectName;
}
