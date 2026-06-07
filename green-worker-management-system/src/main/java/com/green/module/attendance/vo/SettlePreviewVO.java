package com.green.module.attendance.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 结算预览VO
 */
@Data
public class SettlePreviewVO {

    /** 起始日期 */
    private String dateFrom;

    /** 终止日期 */
    private String dateTo;

    /** 该时段内未结清记录列表 */
    private List<RecordItem> records;

    /** 出勤天数（全天=1，半天=0.5） */
    private BigDecimal attendanceDays;

    /** 总加班时长（小时） */
    private BigDecimal totalOvertimeHours;

    /** 基础日薪 */
    private BigDecimal baseDailySalary;

    /** 加班时薪 */
    private BigDecimal overtimeHourlyRate;

    /** 工资计算式，如 "11×120+2×15=1350￥" */
    private String formula;

    /** 结算总金额 */
    private BigDecimal totalAmount;

    @Data
    public static class RecordItem {
        private Long recordId;
        private String attendanceDate;
        private Integer attendanceType;
        private String attendanceTypeText;
        private BigDecimal overtimeHours;
        private BigDecimal totalWage;
    }
}
