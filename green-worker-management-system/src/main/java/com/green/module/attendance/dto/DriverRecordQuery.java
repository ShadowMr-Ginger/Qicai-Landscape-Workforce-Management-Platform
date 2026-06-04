package com.green.module.attendance.dto;

import com.green.common.base.BaseQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

/**
 * 司机考勤记录查询条件
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class DriverRecordQuery extends BaseQuery {

    private String driverName;
    private Integer isSettled;
    private LocalDate dateFrom;
    private LocalDate dateTo;
}
