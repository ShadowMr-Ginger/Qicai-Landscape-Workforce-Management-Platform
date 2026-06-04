package com.green.module.auth.vo;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 司机登录成功返回对象
 *
 * <p>在通用登录返回基础上，增加 firstLogin 字段，
 * 标识司机是否首次登录（未修改默认密码）。</p>
 *
 * <p>前端根据此字段判断：若为 true，则强制跳转到修改密码页面。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class DriverLoginVO extends LoginVO {

    /**
     * 是否首次登录（未修改默认密码）
     * <p>true = 首次登录，必须修改密码</p>
     * <p>false = 已修改过密码，正常进入系统</p>
     */
    private Boolean firstLogin;
}
