package com.green.module.attendance.dto;

import com.green.common.base.BaseQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

/**
 * 工人考勤记录查询条件
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class WorkerRecordQuery extends BaseQuery {

    private String workerName;
    private Integer gender;
    private Integer isSkilledWorker;
    private Long groupId;
    private Integer isSettled;
    private Long driverId;
    private LocalDate dateFrom;
    private LocalDate dateTo;
}
