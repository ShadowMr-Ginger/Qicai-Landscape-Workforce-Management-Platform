package com.green.module.attendance.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 考勤批次列表VO
 */
@Data
public class BatchListVO {

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
}
