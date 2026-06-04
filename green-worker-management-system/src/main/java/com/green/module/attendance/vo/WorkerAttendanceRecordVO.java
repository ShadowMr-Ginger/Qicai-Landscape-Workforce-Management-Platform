package com.green.module.attendance.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 工人考勤记录VO
 */
@Data
public class WorkerAttendanceRecordVO {

    private Long id;
    private Long batchId;
    private Long workerId;
    private String workerName;
    private String genderText;
    private String isSkilledWorkerText;
    private String groupName;
    private Long projectId;
    private String projectName;
    private Long workTypeId;
    private String workTypeName;

    private LocalDate attendanceDate;
    private Integer attendanceType;
    private String attendanceTypeText;
    private BigDecimal overtimeHours;
    private BigDecimal dailyWage;
    private BigDecimal overtimeWage;
    private BigDecimal totalWage;
    private String remark;
    private Integer isSettled;
    private String isSettledText;

    private Long driverId;
    private String driverName;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime settledTime;
}
