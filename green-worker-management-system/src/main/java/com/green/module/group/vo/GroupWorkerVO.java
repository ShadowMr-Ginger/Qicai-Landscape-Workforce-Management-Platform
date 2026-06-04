package com.green.module.group.vo;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 组内工人 VO
 */
@Data
public class GroupWorkerVO {

    private Long id;

    private String name;

    private Integer gender;

    private String genderText;

    private String phone;

    private BigDecimal baseDailySalary;

    private BigDecimal overtimeHourlyRate;

    private Integer isEmployed;

    private String isEmployedText;
}
