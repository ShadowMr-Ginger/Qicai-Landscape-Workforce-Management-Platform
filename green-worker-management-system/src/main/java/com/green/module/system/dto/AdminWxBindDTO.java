package com.green.module.system.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 管理员微信绑定请求参数
 */
@Data
public class AdminWxBindDTO {

    /**
     * 微信登录临时凭证
     * <p>小程序前端调用 wx.login() 获取的 code</p>
     */
    @NotBlank(message = "微信授权码不能为空")
    private String wxCode;

    /**
     * 是否确认解除旧绑定
     * <p>当账号已绑定其他微信时，需要用户确认后才能重新绑定</p>
     */
    private Boolean confirm;
}
