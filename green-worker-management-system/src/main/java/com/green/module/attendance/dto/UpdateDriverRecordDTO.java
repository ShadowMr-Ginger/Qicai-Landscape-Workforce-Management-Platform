package com.green.module.attendance.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 更新司机考勤记录DTO
 */
@Data
public class UpdateDriverRecordDTO {

    @NotNull(message = "司机ID不能为空")
    private Long driverId;

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

    /** 作业类型ID */
    private Long workTypeId;

    /** 备注 */
    private String remark;

    /** 是否已结清: 0-未结清, 1-已结清 */
    private Integer isSettled;
}
