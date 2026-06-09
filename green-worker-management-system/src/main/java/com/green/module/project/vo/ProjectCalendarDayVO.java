package com.green.module.project.vo;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 项目日历每日数据VO
 */
@Data
public class ProjectCalendarDayVO {

    /** 日期 yyyy-MM-dd */
    private String date;

    /** 状态: 0-无记录, 1-有记录 */
    private Integer status;

    /** 男工出勤数 */
    private Integer maleCount;

    /** 女工出勤数 */
    private Integer femaleCount;

    /** 营业额 */
    private BigDecimal revenue;

    /** 利润 */
    private BigDecimal profit;

    /** 待付工资（工人+司机） */
    private BigDecimal payableWage;

    /** 净利润 */
    private BigDecimal netProfit;
}
