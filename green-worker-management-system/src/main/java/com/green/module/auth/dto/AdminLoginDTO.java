package com.green.module.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 管理员登录请求参数
 *
 * <p>管理员通过"账号 + 密码"登录管理后台。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Data
public class AdminLoginDTO {

    /**
     * 登录账号
     */
    @NotBlank(message = "账号不能为空")
    private String username;

    /**
     * 登录密码
     */
    @NotBlank(message = "密码不能为空")
    private String password;
}
