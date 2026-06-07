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
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
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

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final WxApiUtil wxApiUtil;
    private final DriverMapper driverMapper;
    private final AdminMapper adminMapper;

    @Override
    public LoginVO adminLogin(AdminLoginDTO dto) {
        // 1. 执行 Spring Security 认证流程
        Authentication authentication = authenticate(dto.getUsername(), dto.getPassword());
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();

        // 2. 生成 JWT Token
        String token = jwtTokenProvider.generateToken(loginUser);

        // 3. 组装返回结果
        LoginVO loginVO = new LoginVO();
        loginVO.setToken(token);
        loginVO.setUserInfo(convertToCurrentUserVO(loginUser));

        log.info("管理员登录成功: username={}", dto.getUsername());
        return loginVO;
    }

    @Override
    public DriverLoginVO driverLogin(DriverLoginDTO dto) {
        // 1. 执行 Spring Security 认证流程
        // 司机登录时，username 即为姓名（name）
        Authentication authentication = authenticate(dto.getName(), dto.getPassword());
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();

        // 2. 生成 JWT Token
        String token = jwtTokenProvider.generateToken(loginUser);

        // 3. 组装返回结果
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
     * 封装认证逻辑
     *
     * @param username 用户名
     * @param password 密码
     * @return 认证成功的 Authentication 对象
     */
    private Authentication authenticate(String username, String password) {
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(username, password);
        return authenticationManager.authenticate(authenticationToken);
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
