package com.green.module.attendance.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * 管理员手动创建考勤批次DTO
 */
@Data
public class CreateBatchDTO {

    @NotNull(message = "审核司机不能为空")
    private Long driverId;

    @NotNull(message = "考勤日期不能为空")
    private LocalDate batchDate;

    @NotEmpty(message = "至少选择一名工人")
    private List<WorkerAttendanceItem> workers;

    /** 批次统一出勤类型: 1-半天, 2-全天 */
    @NotNull(message = "出勤类型不能为空")
    private Integer attendanceType;

    /** 批次统一加班时长 */
    private BigDecimal overtimeHours;

    /** 批次统一作业类型ID */
    private Long workTypeId;

    private String remark;

    @Data
    public static class WorkerAttendanceItem {
        @NotNull(message = "工人ID不能为空")
        private Long workerId;

        @NotNull(message = "出勤类型不能为空")
        private Integer attendanceType;

        private BigDecimal overtimeHours;

        private Long projectId;

        private Long workTypeId;

        private String remark;
    }
}
