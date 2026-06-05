package com.green.module.driver.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 新增司机参数
 */
@Data
public class CreateDriverDTO {

    @NotBlank(message = "姓名不能为空")
    private String realName;

    @NotNull(message = "性别不能为空")
    private Integer gender;

    private String phone;

    private String idCard;

    private String emergencyContactPhone;

    @NotNull(message = "基础日薪不能为空")
    private BigDecimal baseDailySalary;

    @NotNull(message = "加班时薪不能为空")
    private BigDecimal overtimeHourlyRate;
}
