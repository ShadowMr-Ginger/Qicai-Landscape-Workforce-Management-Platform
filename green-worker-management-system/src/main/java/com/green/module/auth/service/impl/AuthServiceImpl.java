package com.green.module.auth.service.impl;

import cn.hutool.json.JSONObject;
import com.green.common.exception.BusinessException;
import com.green.common.result.ResultCodeEnum;
import com.green.module.auth.dto.AdminLoginDTO;
import com.green.module.auth.dto.DriverLoginDTO;
import com.green.module.auth.dto.DriverWxLoginDTO;
import com.green.module.auth.service.AuthService;
import com.green.module.auth.vo.CurrentUserVO;
import com.green.module.auth.vo.DriverLoginVO;
import com.green.module.auth.vo.LoginVO;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.green.module.driver.entity.DriverEntity;
import com.green.module.driver.mapper.DriverMapper;
import com.green.module.system.entity.AdminEntity;
import com.green.module.system.mapper.AdminMapper;
import com.green.security.JwtTokenProvider;
import com.green.security.LoginUser;
import com.green.utils.SecurityUtils;
import com.green.utils.WxApiUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * 认证服务实现
 *
 * <p>实现登录认证的核心逻辑，包括管理员登录、司机登录、获取当前用户。</p>
 *
 * <h3>登录流程说明</h3>
 * <ol>
 *     <li>接收前端传入的账号/姓名 + 密码</li>
 *     <li>封装为 {@link UsernamePasswordAuthenticationToken} 提交给 Spring Security 认证</li>
 *     <li>Spring Security 调用 {@link com.green.security.UserDetailsServiceImpl} 查询用户</li>
 *     <li>使用 BCrypt 比对密码</li>
 *     <li>认证成功后生成 JWT Token 返回给前端</li>
 * </ol>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final JwtTokenProvider jwtTokenProvider;
    private final WxApiUtil wxApiUtil;
    private final DriverMapper driverMapper;
    private final AdminMapper adminMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public LoginVO adminLogin(AdminLoginDTO dto) {
        // 1. 直接查询管理员表（管理员登录与司机登录完全分离，避免同名冲突）
        AdminEntity admin = adminMapper.selectOne(
                new LambdaQueryWrapper<AdminEntity>()
                        .eq(AdminEntity::getUsername, dto.getUsername())
                        .eq(AdminEntity::getIsActive, 1)
        );

        if (admin == null) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "账号或密码错误");
        }

        // 2. 校验密码
        if (!passwordEncoder.matches(dto.getPassword(), admin.getPassword())) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "账号或密码错误");
        }

        // 3. 构建 LoginUser
        LoginUser loginUser = LoginUser.builder()
                .userId(admin.getId())
                .username(admin.getUsername())
                .realName(admin.getRealName())
                .role(com.green.common.enums.RoleEnum.ADMIN)
                .password(admin.getPassword())
                .enabled(admin.getIsActive() == 1)
                .build();

        // 4. 生成 JWT Token
        String token = jwtTokenProvider.generateToken(loginUser);

        // 5. 组装返回结果
        LoginVO loginVO = new LoginVO();
        loginVO.setToken(token);
        loginVO.setUserInfo(convertToCurrentUserVO(loginUser));

        log.info("管理员登录成功: username={}", dto.getUsername());
        return loginVO;
    }

    @Override
    public DriverLoginVO driverLogin(DriverLoginDTO dto) {
        // 1. 直接查询司机表（避免同名管理员被 Spring Security 优先匹配为 ADMIN）
        DriverEntity driver = driverMapper.selectOne(
                new LambdaQueryWrapper<DriverEntity>()
                        .eq(DriverEntity::getRealName, dto.getName())
                        .eq(DriverEntity::getIsActive, 1)
        );

        if (driver == null) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "账号或密码错误");
        }

        // 2. 校验密码
        if (!passwordEncoder.matches(dto.getPassword(), driver.getPassword())) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "账号或密码错误");
        }

        // 3. 构建 LoginUser
        LoginUser loginUser = LoginUser.builder()
                .userId(driver.getId())
                .username(driver.getRealName())
                .realName(driver.getRealName())
                .role(com.green.common.enums.RoleEnum.DRIVER)
                .password(driver.getPassword())
                .passwordChanged(driver.getPasswordChanged() != null && driver.getPasswordChanged() == 1)
                .enabled(driver.getIsActive() == 1)
                .build();

        // 4. 生成 JWT Token
        String token = jwtTokenProvider.generateToken(loginUser);

        // 5. 组装返回结果
        DriverLoginVO loginVO = new DriverLoginVO();
        loginVO.setToken(token);
        loginVO.setUserInfo(convertToCurrentUserVO(loginUser));
        // 若 passwordChanged 为 false，表示首次登录（未修改默认密码）
        loginVO.setFirstLogin(Boolean.FALSE.equals(loginUser.getPasswordChanged()));

        log.info("司机登录成功: name={}, firstLogin={}", dto.getName(), loginVO.getFirstLogin());
        return loginVO;
    }

    @Override
    public CurrentUserVO getCurrentUser() {
        LoginUser loginUser = SecurityUtils.getCurrentUser();
        if (loginUser == null) {
            throw new BusinessException(ResultCodeEnum.UNAUTHORIZED);
        }
        return convertToCurrentUserVO(loginUser);
    }

    @Override
    public DriverLoginVO driverWxLogin(DriverWxLoginDTO dto) {
        // 1. 调用微信接口换取 OpenID
        JSONObject wxResult = wxApiUtil.code2Session(dto.getWxCode());
        if (wxResult == null) {
            throw new BusinessException(ResultCodeEnum.WX_BIND_FAILED, "微信授权失败，请重试");
        }
        String openid = wxResult.getStr("openid");
        if (openid == null || openid.isEmpty()) {
            throw new BusinessException(ResultCodeEnum.WX_BIND_FAILED, "获取微信用户信息失败");
        }

        // 2. 根据 OpenID 查找司机
        LambdaQueryWrapper<DriverEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DriverEntity::getWxOpenid, openid);
        DriverEntity driver = driverMapper.selectOne(wrapper);
        if (driver == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "该微信尚未绑定司机账号，请先使用账号密码登录并绑定微信");
        }
        if (driver.getIsActive() == 0) {
            throw new BusinessException(ResultCodeEnum.FORBIDDEN, "账号已停用");
        }

        // 3. 构建 LoginUser 并生成 Token
        LoginUser loginUser = LoginUser.builder()
                .userId(driver.getId())
                .username(driver.getRealName())
                .realName(driver.getRealName())
                .password(driver.getPassword())
                .role(com.green.common.enums.RoleEnum.DRIVER)
                .passwordChanged(driver.getPasswordChanged() != null && driver.getPasswordChanged() == 1)
                .enabled(true)
                .build();

        String token = jwtTokenProvider.generateToken(loginUser);

        DriverLoginVO loginVO = new DriverLoginVO();
        loginVO.setToken(token);
        loginVO.setUserInfo(convertToCurrentUserVO(loginUser));
        loginVO.setFirstLogin(Boolean.FALSE.equals(loginUser.getPasswordChanged()));

        log.info("司机微信登录成功: driverId={}, name={}", driver.getId(), driver.getRealName());
        return loginVO;
    }

    @Override
    public LoginVO adminWxLogin(String wxCode) {
        // 1. 调用微信接口换取 OpenID
        JSONObject wxResult = wxApiUtil.code2Session(wxCode);
        if (wxResult == null) {
            throw new BusinessException(ResultCodeEnum.WX_BIND_FAILED, "微信授权失败，请重试");
        }
        String openid = wxResult.getStr("openid");
        if (openid == null || openid.isEmpty()) {
            throw new BusinessException(ResultCodeEnum.WX_BIND_FAILED, "获取微信用户信息失败");
        }

        // 2. 根据 OpenID 查找管理员
        LambdaQueryWrapper<AdminEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AdminEntity::getWxOpenid, openid);
        AdminEntity admin = adminMapper.selectOne(wrapper);
        if (admin == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "该微信尚未绑定管理员账号，请先使用账号密码登录并绑定微信");
        }
        if (admin.getIsActive() == 0) {
            throw new BusinessException(ResultCodeEnum.FORBIDDEN, "账号已停用");
        }

        // 3. 构建 LoginUser 并生成 Token
        LoginUser loginUser = LoginUser.builder()
                .userId(admin.getId())
                .username(admin.getUsername())
                .realName(admin.getRealName())
                .password(admin.getPassword())
                .role(com.green.common.enums.RoleEnum.ADMIN)
                .enabled(true)
                .build();

        String token = jwtTokenProvider.generateToken(loginUser);

        LoginVO loginVO = new LoginVO();
        loginVO.setToken(token);
        loginVO.setUserInfo(convertToCurrentUserVO(loginUser));

        log.info("管理员微信登录成功: adminId={}, username={}", admin.getId(), admin.getUsername());
        return loginVO;
    }

    @Override
    public void logout() {
        // 本系统采用 JWT 无状态认证，不维护服务端会话
        // 退出登录由前端删除本地 Token 实现，后端无需额外操作
        log.info("用户退出登录: userId={}, userType={}",
                SecurityUtils.getCurrentUserId(),
                SecurityUtils.isAdmin() ? "ADMIN" : "DRIVER");
    }

    /**
     * 将 LoginUser 转换为 CurrentUserVO
     */
    private CurrentUserVO convertToCurrentUserVO(LoginUser loginUser) {
        CurrentUserVO vo = new CurrentUserVO();
        vo.setUserId(loginUser.getUserId());
        vo.setUserType(loginUser.getRole().getCode());
        vo.setName(loginUser.getRealName());
        vo.setRoleName(loginUser.getRole().getDescription());
        return vo;
    }
}
