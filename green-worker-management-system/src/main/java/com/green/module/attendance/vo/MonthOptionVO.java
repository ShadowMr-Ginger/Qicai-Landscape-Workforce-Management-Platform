package com.green.module.attendance.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 年月选项
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthOptionVO {

    private Integer year;

    private Integer month;

    private String label;
}
