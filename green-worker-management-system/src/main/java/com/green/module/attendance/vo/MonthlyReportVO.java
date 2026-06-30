package com.green.module.attendance.vo;

import lombok.Data;

import java.util.List;

/**
 * 月度考勤表 - 完整报表数据
 */
@Data
public class MonthlyReportVO {

    /**
     * 年份
     */
    private Integer year;

    /**
     * 月份
     */
    private Integer month;

    /**
     * 组别名称（工人表为具体组别，司机表固定为“司机”）
     */
    private String groupName;

    /**
     * 当月天数
     */
    private Integer daysInMonth;

    /**
     * 人员记录列表
     */
    private List<MonthlyReportRecordVO> records;

    /**
     * 合计行
     */
    private MonthlyReportRecordVO summary;
}
