package com.green.module.driver.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 修改司机信息请求参数
 *
 * @author Green Team
 * @version 1.0.0
 */
@Data
public class UpdateDriverDTO {

    @NotBlank(message = "姓名不能为空")
    private String realName;

    @NotNull(message = "性别不能为空")
    private Integer gender;

    private String phone;

    @NotNull(message = "基础日薪不能为空")
    private BigDecimal baseDailySalary;

    @NotNull(message = "加班时薪不能为空")
    private BigDecimal overtimeHourlyRate;
}
