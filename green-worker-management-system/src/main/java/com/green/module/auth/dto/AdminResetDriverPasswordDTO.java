package com.green.module.auth.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 管理员重置司机密码请求参数
 *
 * <p>管理员在后台可将司机密码重置为默认密码 123456，
 * 重置后司机再次登录时必须重新修改密码。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Data
public class AdminResetDriverPasswordDTO {

    /**
     * 司机ID
     */
    @NotNull(message = "司机ID不能为空")
    private Long driverId;
}
