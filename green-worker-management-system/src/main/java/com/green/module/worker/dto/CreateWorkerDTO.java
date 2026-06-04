package com.green.module.worker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 新增工人参数
 */
@Data
public class CreateWorkerDTO {

    @NotBlank(message = "姓名不能为空")
    private String name;

    @NotNull(message = "性别不能为空")
    private Integer gender;

    private Long groupId;

    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String phone;

    private String idCard;

    @NotNull(message = "基础日薪不能为空")
    private BigDecimal baseDailySalary;

    @NotNull(message = "加班时薪不能为空")
    private BigDecimal overtimeHourlyRate;

    private String emergencyContactPhone;

    @NotNull(message = "是否技术工不能为空")
    private Integer isSkilledWorker;

    private Long defaultProjectId;
}
