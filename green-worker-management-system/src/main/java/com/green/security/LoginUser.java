package com.green.security;

import com.green.common.enums.RoleEnum;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

/**
 * 统一登录用户对象
 *
 * <p>实现 Spring Security 的 {@link UserDetails} 接口，同时适配管理员和司机两种身份。</p>
 * <p>无论管理员还是司机登录，最终都封装为 LoginUser 放入 SecurityContext。</p>
 *
 * <h3>字段说明</h3>
 * <ul>
 *     <li>userId：用户唯一标识（管理员ID 或 司机ID）</li>
 *     <li>username：登录账号（管理员用户名 或 司机手机号）</li>
 *     <li>realName：真实姓名（展示用）</li>
 *     <li>role：角色枚举（ADMIN / DRIVER）</li>
 *     <li>password：加密后的密码（仅用于认证阶段，序列化时忽略）</li>
 *     <li>passwordChanged：是否已修改默认密码（司机首次登录校验用）</li>
 *     <li>enabled：账号是否启用</li>
 * </ul>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginUser implements UserDetails {

    private static final long serialVersionUID = 1L;

    /**
     * 用户ID（管理员ID 或 司机ID）
     */
    private Long userId;

    /**
     * 登录账号
     */
    private String username;

    /**
     * 真实姓名
     */
    private String realName;

    /**
     * 角色枚举
     */
    private RoleEnum role;

    /**
     * 加密后的密码
     * <p>JsonIgnore 防止序列化到前端</p>
     */
    @JsonIgnore
    private String password;

    /**
     * 是否已修改默认密码
     * <p>司机首次登录时必须强制修改为自定义密码</p>
     */
    private Boolean passwordChanged;

    /**
     * 账号是否启用
     */
    private Boolean enabled;

    // ==================== Spring Security 接口实现 ====================

    /**
     * 获取用户权限列表
     * <p>将角色转换为 Spring Security 要求的 ROLE_XXX 格式</p>
     */
    @Override
    @JsonIgnore
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (role == null) {
            return Collections.emptyList();
        }
        return Collections.singletonList(new SimpleGrantedAuthority(role.getSecurityRole()));
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    @JsonIgnore
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled != null && enabled;
    }

    /**
     * 判断当前用户是否为管理员
     */
    public boolean isAdmin() {
        return RoleEnum.ADMIN.equals(this.role);
    }

    /**
     * 判断当前用户是否为司机
     */
    public boolean isDriver() {
        return RoleEnum.DRIVER.equals(this.role);
    }
}
