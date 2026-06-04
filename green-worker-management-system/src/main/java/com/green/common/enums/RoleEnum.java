package com.green.common.enums;

import com.green.common.constants.SystemConstants;
import lombok.Getter;

/**
 * 角色枚举
 *
 * <p>系统仅设计两种角色：管理员（ADMIN）和司机（DRIVER）。</p>
 * <p>Spring Security 的权限判断要求角色名以 {@code ROLE_} 前缀开头，
 * 本枚举的 {@link #getSecurityRole()} 方法会自动拼接前缀。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Getter
public enum RoleEnum {

    /**
     * 管理员（老板/超级管理员）
     * <p>拥有所有权限：项目管理、批次审核、工资结算、系统配置等</p>
     */
    ADMIN("ADMIN", "管理员"),

    /**
     * 司机
     * <p>权限范围：提交考勤批次、撤回待审核批次、管理常用工人、查看自己的工资</p>
     */
    DRIVER("DRIVER", "司机");

    /**
     * 角色代码（数据库存储值）
     */
    private final String code;

    /**
     * 角色描述
     */
    private final String description;

    RoleEnum(String code, String description) {
        this.code = code;
        this.description = description;
    }

    /**
     * 获取 Spring Security 要求的角色格式（带 ROLE_ 前缀）
     *
     * @return 例如：ROLE_ADMIN、ROLE_DRIVER
     */
    public String getSecurityRole() {
        return SystemConstants.ROLE_PREFIX + this.code;
    }

    /**
     * 根据角色代码获取枚举
     *
     * @param code 角色代码
     * @return 对应的 RoleEnum，若不存在返回 null
     */
    public static RoleEnum fromCode(String code) {
        for (RoleEnum role : values()) {
            if (role.getCode().equalsIgnoreCase(code)) {
                return role;
            }
        }
        return null;
    }
}
