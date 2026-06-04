package com.green.security;

import com.green.common.enums.RoleEnum;
import com.green.module.driver.entity.DriverEntity;
import com.green.module.driver.mapper.DriverMapper;
import com.green.module.system.entity.AdminEntity;
import com.green.module.system.mapper.AdminMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * 用户详情服务实现
 *
 * <p>实现 Spring Security 的 {@link UserDetailsService}，用于登录时根据用户名查询用户信息。</p>
 * <p>系统存在两套用户体系（管理员 + 司机），本服务统一处理：</p>
 * <ol>
 *     <li>先按管理员查询（用户名匹配）</li>
 *     <li>未找到则按司机查询（手机号匹配）</li>
 *     <li>找到后封装为 {@link LoginUser} 返回</li>
 * </ol>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final AdminMapper adminMapper;
    private final DriverMapper driverMapper;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 第一步：尝试查找管理员（按用户名）
        AdminEntity admin = adminMapper.selectOne(
                new LambdaQueryWrapper<AdminEntity>()
                        .eq(AdminEntity::getUsername, username)
                        .eq(AdminEntity::getIsActive, 1)
        );

        if (admin != null) {
            return LoginUser.builder()
                    .userId(admin.getId())
                    .username(admin.getUsername())
                    .realName(admin.getRealName())
                    .role(RoleEnum.ADMIN)
                    .password(admin.getPassword())
                    .passwordChanged(true) // 管理员默认已修改密码
                    .enabled(admin.getIsActive() == 1)
                    .build();
        }

        // 第二步：尝试查找司机（按手机号）
        DriverEntity driver = driverMapper.selectOne(
                new LambdaQueryWrapper<DriverEntity>()
                        .eq(DriverEntity::getPhone, username)
                        .eq(DriverEntity::getIsActive, 1)
        );

        if (driver != null) {
            return LoginUser.builder()
                    .userId(driver.getId())
                    .username(driver.getPhone())
                    .realName(driver.getRealName())
                    .role(RoleEnum.DRIVER)
                    .password(driver.getPassword())
                    .passwordChanged(driver.getPasswordChanged() != null ? driver.getPasswordChanged() : false)
                    .enabled(driver.getIsActive() == 1)
                    .build();
        }

        // 都没找到，抛出异常（Spring Security 会将其转换为 BadCredentialsException）
        log.warn("用户登录失败，账号不存在: {}", username);
        throw new UsernameNotFoundException("账号或密码错误");
    }
}
