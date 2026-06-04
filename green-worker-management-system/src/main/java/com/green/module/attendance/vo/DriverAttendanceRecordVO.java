package com.green.module.attendance.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 司机考勤记录VO
 */
@Data
public class DriverAttendanceRecordVO {

    private Long id;
    private Long driverId;
    private String driverName;
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

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime settledTime;
}
