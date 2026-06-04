package com.green.module.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 司机登录请求参数
 *
 * <p>司机通过"姓名 + 密码"登录小程序。</p>
 * <p>默认密码为 123456，首次登录后必须修改密码。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Data
public class DriverLoginDTO {

    /**
     * 姓名
     * <p>对应数据库 drivers.real_name 字段</p>
     */
    @NotBlank(message = "姓名不能为空")
    private String name;

    /**
     * 登录密码
     */
    @NotBlank(message = "密码不能为空")
    private String password;
}
