package com.green.module.attendance.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.green.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 工人考勤记录实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("worker_attendance_records")
public class WorkerAttendanceRecordEntity extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /** 所属考勤批次ID */
    private Long batchId;

    /** 审核司机ID */
    private Long driverId;

    /** 工人ID */
    private Long workerId;

    /** 分配的项目ID */
    private Long projectId;

    /** 考勤日期 */
    private LocalDate attendanceDate;

    /** 出勤类型: 1-半天, 2-全天 */
    private Integer attendanceType;

    /** 加班时长(小时) */
    private BigDecimal overtimeHours;

    /** 作业类型ID */
    private Long workTypeId;

    /** 当日基础工资(元) */
    private BigDecimal dailyWage;

    /** 当日加班工资(元) */
    private BigDecimal overtimeWage;

    /** 当日总工资(元) */
    private BigDecimal totalWage;

    /** 备注 */
    private String remark;

    /** 是否已结清: 1-已结清, 0-未结清 */
    private Integer isSettled;

    /** 结清时间 */
    private LocalDateTime settledTime;

    /** 结清操作人ID */
    private Long settledBy;
}
