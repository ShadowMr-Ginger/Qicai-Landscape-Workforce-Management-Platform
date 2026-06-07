package com.green.module.attendance.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 更新工人考勤记录DTO
 */
@Data
public class UpdateWorkerRecordDTO {

    @NotNull(message = "工人ID不能为空")
    private Long workerId;

    @NotNull(message = "考勤日期不能为空")
    private LocalDate attendanceDate;

    /** 出勤类型: 1-半天, 2-全天 */
    @NotNull(message = "出勤类型不能为空")
    private Integer attendanceType;

    /** 加班时长 */
    private BigDecimal overtimeHours;

    /** 当日基础工资 */
    @NotNull(message = "基础工资不能为空")
    private BigDecimal dailyWage;

    /** 当日加班工资 */
    private BigDecimal overtimeWage;

    /** 项目ID */
    private Long projectId;

    /** 作业类型ID */
    private Long workTypeId;

    /** 备注 */
    private String remark;

    /** 是否已结清: 0-未结清, 1-已结清 */
    private Integer isSettled;

    /** 审核司机ID（可选，修改关联批次的司机） */
    private Long driverId;
}
