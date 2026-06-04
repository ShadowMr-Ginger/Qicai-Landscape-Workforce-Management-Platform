package com.green.module.auth.service.impl;

import com.green.common.exception.BusinessException;
import com.green.common.result.ResultCodeEnum;
import com.green.module.auth.dto.AdminLoginDTO;
import com.green.module.auth.dto.DriverLoginDTO;
import com.green.module.auth.service.AuthService;
import com.green.module.auth.vo.CurrentUserVO;
import com.green.module.auth.vo.DriverLoginVO;
import com.green.module.auth.vo.LoginVO;
import com.green.security.JwtTokenProvider;
import com.green.security.LoginUser;
import com.green.utils.SecurityUtils;
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
