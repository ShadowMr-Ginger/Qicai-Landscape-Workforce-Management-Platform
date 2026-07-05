package com.green.module.attendance.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * 审核批次并更新工人考勤记录DTO
 */
@Data
public class ReviewBatchDTO {

    @NotNull(message = "批次ID不能为空")
    private Long batchId;

    /** 工人记录更新项 */
    private List<WorkerRecordUpdateItem> workerRecords;

    /** 司机记录更新项 */
    private DriverRecordUpdateItem driverRecord;

    @Data
    public static class WorkerRecordUpdateItem {
        @NotNull(message = "记录ID不能为空")
        private Long recordId;

        /** 作业类型ID */
        private Long workTypeId;

        /** 项目ID */
        private Long projectId;

        /** 考勤日期（提交时默认批次日期，审核时可修改） */
        private LocalDate attendanceDate;

        /** 出勤类型: 1-半天, 2-全天 */
        private Integer attendanceType;

        /** 加班时长 */
        private BigDecimal overtimeHours;

        /** 当日基础工资 */
        private BigDecimal dailyWage;

        /** 当日加班工资 */
        private BigDecimal overtimeWage;

        /** 当日总工资 */
        private BigDecimal totalWage;

        /** 备注 */
        private String remark;
    }

    @Data
    public static class DriverRecordUpdateItem {
        @NotNull(message = "司机记录ID不能为空")
        private Long recordId;

        /** 考勤日期（提交时默认批次日期，审核时可修改） */
        private LocalDate attendanceDate;

        /** 关联项目ID（审核时确定） */
        private Long projectId;

        /** 加班时长 */
        private BigDecimal overtimeHours;

        /** 日薪 */
        private BigDecimal dailyWage;

        /** 备注 */
        private String remark;
    }
}
