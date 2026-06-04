package com.green.utils;

import com.green.common.enums.RoleEnum;
import com.green.security.LoginUser;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * 安全工具类
 *
 * <p>封装获取当前登录用户、判断角色等常用安全相关操作。</p>
 * <p>所有方法均为静态方法，便于在 Service 层任意位置调用。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
public class SecurityUtils {

    private SecurityUtils() {
    }

    /**
     * 获取当前登录用户
     *
     * @return LoginUser 对象，若未登录返回 null
     */
    public static LoginUser getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof LoginUser) {
            return (LoginUser) authentication.getPrincipal();
        }
        return null;
    }

    /**
     * 获取当前登录用户ID
     *
     * @return 用户ID，若未登录返回 null
     */
    public static Long getCurrentUserId() {
        LoginUser user = getCurrentUser();
        return user != null ? user.getUserId() : null;
    }

    /**
     * 获取当前登录用户真实姓名
     */
    public static String getCurrentUserRealName() {
        LoginUser user = getCurrentUser();
        return user != null ? user.getRealName() : "";
    }

    /**
     * 判断当前用户是否为管理员
     */
    public static boolean isAdmin() {
        LoginUser user = getCurrentUser();
        return user != null && RoleEnum.ADMIN.equals(user.getRole());
    }

    /**
     * 判断当前用户是否为司机
     */
    public static boolean isDriver() {
        LoginUser user = getCurrentUser();
        return user != null && RoleEnum.DRIVER.equals(user.getRole());
    }

    /**
     * 判断当前是否已登录
     */
    public static boolean isAuthenticated() {
        return getCurrentUser() != null;
    }
}
