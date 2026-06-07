package com.green.module.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 司机微信登录请求参数
 */
@Data
public class DriverWxLoginDTO {

    /**
     * 微信登录临时凭证
     * <p>小程序前端调用 wx.login() 获取的 code</p>
     */
    @NotBlank(message = "微信授权码不能为空")
    private String wxCode;
}
