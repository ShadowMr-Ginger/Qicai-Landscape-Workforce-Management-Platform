package com.green.module.driver.vo;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 司机列表项视图对象
 *
 * @author Green Team
 * @version 1.0.0
 */
@Data
public class DriverListVO {

    private Long id;
    private String realName;
    private String genderText;
    private String phone;
    private BigDecimal baseDailySalary;
    private BigDecimal overtimeHourlyRate;
    private Integer isActive;
}
