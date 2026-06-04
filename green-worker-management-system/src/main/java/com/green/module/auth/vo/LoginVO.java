package com.green.module.auth.vo;

import lombok.Data;

/**
 * 登录成功返回对象
 *
 * <p>包含 JWT Token 和当前登录用户的基本信息。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Data
public class LoginVO {

    /**
     * JWT Token
     * <p>前端需保存到本地存储，后续请求通过 Authorization Header 携带</p>
     */
    private String token;

    /**
     * 用户信息
     */
    private CurrentUserVO userInfo;
}
