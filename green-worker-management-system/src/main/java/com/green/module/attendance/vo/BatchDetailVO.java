package com.green.module.attendance.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 考勤批次详情VO
 */
@Data
public class BatchDetailVO {

    private Long id;
    private Long driverId;
    private String driverName;
    private LocalDate batchDate;
    private Integer status;
    private String statusText;
    private Integer totalWorkers;
    private String remark;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime submitTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime reviewTime;

    private Long reviewerId;
    private String reviewerName;

    private List<WorkerAttendanceRecordVO> workerRecords;

    /** 司机考勤记录（与批次关联） */
    private DriverAttendanceRecordVO driverRecord;
}
