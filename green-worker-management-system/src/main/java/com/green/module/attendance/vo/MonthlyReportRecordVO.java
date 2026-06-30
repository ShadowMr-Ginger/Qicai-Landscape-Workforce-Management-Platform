package com.green.module.attendance.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 月度考勤表 - 单个人员记录
 */
@Data
public class MonthlyReportRecordVO {

    /**
     * 序号
     */
    private Integer no;

    /**
     * 姓名
     */
    private String name;

    /**
     * 1-31 日的工资与加班信息
     */
    private List<MonthlyReportDayVO> dailyWages;

    /**
     * 出勤天数
     */
    private BigDecimal attendanceDays;

    /**
     * 加班时长
     */
    private BigDecimal overtimeHours;

    /**
     * 合计工资
     */
    private BigDecimal totalWage;

    /**
     * 备注
     */
    private String remark;
}
