package com.green.module.worker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 修改工人信息请求参数
 *
 * @author Green Team
 * @version 1.0.0
 */
@Data
public class UpdateWorkerDTO {

    /**
     * 姓名
     */
    @NotBlank(message = "姓名不能为空")
    private String name;

    /**
     * 性别：1-男，2-女
     */
    @NotNull(message = "性别不能为空")
    private Integer gender;

    /**
     * 所属组别ID
     */
    private Long groupId;

    /**
     * 手机号
     */
    private String phone;

    /**
     * 身份证号
     */
    private String idCard;

    /**
     * 基础日薪（元）
     */
    @NotNull(message = "基础日薪不能为空")
    private BigDecimal baseDailySalary;

    /**
     * 加班时薪（元/小时）
     */
    @NotNull(message = "加班时薪不能为空")
    private BigDecimal overtimeHourlyRate;

    /**
     * 紧急联系人电话
     */
    private String emergencyContactPhone;

    /**
     * 是否技术工人：1-是，0-否
     */
    @NotNull(message = "请选择是否为技术工人")
    private Integer isSkilledWorker;

    /**
     * 默认项目ID
     */
    private Long defaultProjectId;
}
