package com.green.module.attendance.dto;

import com.green.common.base.BaseQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

/**
 * 考勤批次查询条件
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class BatchQuery extends BaseQuery {

    private Integer status;
    private Long driverId;
    private LocalDate dateFrom;
    private LocalDate dateTo;
}
