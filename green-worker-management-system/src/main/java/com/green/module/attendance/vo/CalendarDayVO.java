package com.green.module.attendance.vo;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 日历单日VO
 */
@Data
public class CalendarDayVO {

    /** 日期 yyyy-MM-dd */
    private String date;

    /** 状态: 0-无记录, 1-出勤未结清, 2-出勤已结清 */
    private Integer status;

    /** 记录ID */
    private Long recordId;

    /** 当日工资 */
    private BigDecimal totalWage;
}
