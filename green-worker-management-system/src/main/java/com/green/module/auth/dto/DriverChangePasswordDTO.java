package com.green.module.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 司机修改密码请求参数
 *
 * <p>司机首次登录后，必须通过此接口修改默认密码（123456），
 * 修改成功后方可访问业务功能。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Data
public class DriverChangePasswordDTO {

    /**
     * 旧密码
     * <p>首次修改时旧密码为 123456</p>
     */
    @NotBlank(message = "旧密码不能为空")
    private String oldPassword;

    /**
     * 新密码
     * <p>长度 6~20 位，不允许与旧密码相同</p>
     */
    @NotBlank(message = "新密码不能为空")
    @Size(min = 6, max = 20, message = "密码长度必须在 6~20 位之间")
    private String newPassword;
}
