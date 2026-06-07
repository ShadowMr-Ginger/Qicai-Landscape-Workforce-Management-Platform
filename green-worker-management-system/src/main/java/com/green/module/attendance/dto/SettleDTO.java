package com.green.module.attendance.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

/**
 * 结算考勤记录DTO
 */
@Data
public class SettleDTO {

    /** 结算起始日期（包含） */
    @NotNull(message = "起始日期不能为空")
    private LocalDate dateFrom;

    /** 结算终止日期（包含） */
    @NotNull(message = "终止日期不能为空")
    private LocalDate dateTo;
}
