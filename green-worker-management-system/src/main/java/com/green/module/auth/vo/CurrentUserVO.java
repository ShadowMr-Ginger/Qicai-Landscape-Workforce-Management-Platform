package com.green.module.auth.vo;

import lombok.Data;

/**
 * 当前登录用户信息
 *
 * <p>用于 /api/auth/current-user 接口返回，
 * 前端根据此信息展示用户头像、名称、角色等。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Data
public class CurrentUserVO {

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 用户类型
     * <p>ADMIN = 管理员，DRIVER = 司机</p>
     */
    private String userType;

    /**
     * 姓名
     */
    private String name;

    /**
     * 角色名称
     */
    private String roleName;
}
