package com.green.module.driver.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 司机详情视图对象
 *
 * @author Green Team
 * @version 1.0.0
 */
@Data
public class DriverDetailVO {

    private Long id;
    private String realName;
    private String genderText;
    private String phone;
    private BigDecimal baseDailySalary;
    private BigDecimal overtimeHourlyRate;
    private String wxOpenid;
    private String isActiveText;
    private Integer passwordChanged;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;
}
