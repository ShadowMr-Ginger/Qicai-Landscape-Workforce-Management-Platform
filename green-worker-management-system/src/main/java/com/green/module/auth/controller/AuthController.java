package com.green.module.auth.controller;

import com.green.common.result.ApiResult;
import com.green.module.auth.dto.AdminLoginDTO;
import com.green.module.auth.dto.DriverLoginDTO;
import com.green.module.auth.dto.DriverWxLoginDTO;
import com.green.module.auth.service.AuthService;
import com.green.module.auth.vo.CurrentUserVO;
import com.green.module.auth.vo.DriverLoginVO;
import com.green.module.auth.vo.LoginVO;
import com.green.module.system.service.SystemLogService;
import com.green.security.LoginUser;
import com.green.utils.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 认证控制器
 *
 * <p>处理所有与登录认证相关的 HTTP 请求，包括管理员登录、司机登录、
 * 获取当前用户信息、退出登录。</p>
 *
 * <h3>接口清单</h3>
 * <ul>
 *     <li>POST /api/auth/admin/login — 管理员登录</li>
 *     <li>POST /api/auth/driver/login — 司机登录</li>
 *     <li>GET /api/auth/current-user — 获取当前登录用户</li>
 *     <li>POST /api/auth/logout — 退出登录</li>
 * </ul>
 *
 * @author Green Team
 * @version 1.0.0
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final SystemLogService systemLogService;

    /**
     * 管理员登录
     *
     * <p>管理员通过账号密码登录管理后台，成功后返回 JWT Token。</p>
     *
     * @param dto 管理员登录参数
     * @param request HTTP 请求
     * @return Token 和管理员信息
     */
    @PostMapping("/admin/login")
    public ApiResult<LoginVO> adminLogin(@RequestBody @Valid AdminLoginDTO dto, HttpServletRequest request) {
        try {
            LoginVO loginVO = authService.adminLogin(dto);
            systemLogService.logAction(
                    loginVO.getUserInfo().getUserId(),
                    loginVO.getUserInfo().getName(),
                    "ADMIN",
                    "LOGIN",
                    "认证管理",
                    "管理员登录: " + dto.getUsername(),
                    "SUCCESS",
                    request
            );
            return ApiResult.success(loginVO);
        } catch (Exception e) {
            systemLogService.logAction(
                    null,
                    "ADMIN",
                    "LOGIN",
                    "认证管理",
                    "管理员登录失败: " + dto.getUsername() + "，原因: " + e.getMessage(),
                    "FAIL",
                    request
            );
            throw e;
        }
    }

    /**
     * 司机登录
     *
     * <p>司机通过姓名密码登录小程序，成功后返回 JWT Token 和首次登录标识。</p>
     *
     * @param dto 司机登录参数
     * @param request HTTP 请求
     * @return Token、首次登录标识和司机信息
     */
    @PostMapping("/driver/login")
    public ApiResult<DriverLoginVO> driverLogin(@RequestBody @Valid DriverLoginDTO dto, HttpServletRequest request) {
        try {
            DriverLoginVO loginVO = authService.driverLogin(dto);
            systemLogService.logAction(
                    loginVO.getUserInfo().getUserId(),
                    loginVO.getUserInfo().getName(),
                    "DRIVER",
                    "LOGIN",
                    "认证管理",
                    "司机登录: " + dto.getName(),
                    "SUCCESS",
                    request
            );
            return ApiResult.success(loginVO);
        } catch (Exception e) {
            systemLogService.logAction(
                    null,
                    "DRIVER",
                    "LOGIN",
                    "认证管理",
                    "司机登录失败: " + dto.getName() + "，原因: " + e.getMessage(),
                    "FAIL",
                    request
            );
            throw e;
        }
    }

    /**
     * 获取当前登录用户信息
     *
     * <p>从请求头中的 Token 解析当前用户信息，用于前端展示头像、名称等。</p>
     *
     * @return 当前用户信息
     */
    @GetMapping("/current-user")
    public ApiResult<CurrentUserVO> getCurrentUser() {
        CurrentUserVO currentUser = authService.getCurrentUser();
        return ApiResult.success(currentUser);
    }

    /**
     * 司机微信登录
     *
     * <p>小程序前端调用 wx.login() 获取 code，传给后端换取 OpenID 并登录。</p>
     *
     * @param dto 微信登录参数
     * @param request HTTP 请求
     * @return Token 和司机信息
     */
    @PostMapping("/driver/wx-login")
    public ApiResult<DriverLoginVO> driverWxLogin(@RequestBody @Valid DriverWxLoginDTO dto, HttpServletRequest request) {
        DriverLoginVO loginVO = authService.driverWxLogin(dto);
        systemLogService.logAction(
                loginVO.getUserInfo().getUserId(),
                loginVO.getUserInfo().getName(),
                "DRIVER",
                "LOGIN",
                "认证管理",
                "司机微信登录: " + loginVO.getUserInfo().getName(),
                "SUCCESS",
                request
        );
        return ApiResult.success(loginVO);
    }

    /**
     * 管理员微信登录
     *
     * <p>小程序前端调用 wx.login() 获取 code，传给后端换取 OpenID 并登录。</p>
     *
     * @param dto 微信登录参数 { wxCode }
     * @param request HTTP 请求
     * @return Token 和管理员信息
     */
    @PostMapping("/admin/wx-login")
    public ApiResult<LoginVO> adminWxLogin(@RequestBody Map<String, String> dto, HttpServletRequest request) {
        String wxCode = dto.get("wxCode");
        LoginVO loginVO = authService.adminWxLogin(wxCode);
        systemLogService.logAction(
                loginVO.getUserInfo().getUserId(),
                loginVO.getUserInfo().getName(),
                "ADMIN",
                "LOGIN",
                "认证管理",
                "管理员微信登录: " + loginVO.getUserInfo().getName(),
                "SUCCESS",
                request
        );
        return ApiResult.success(loginVO);
    }

    /**
     * 退出登录
     *
     * <p>本系统采用 JWT 无状态认证，后端不维护会话。
     * 退出登录仅返回成功，前端删除本地 Token 即可。</p>
     *
     * @param request HTTP 请求
     * @return 操作成功
     */
    @PostMapping("/logout")
    public ApiResult<Void> logout(HttpServletRequest request) {
        LoginUser user = SecurityUtils.getCurrentUser();
        if (user != null) {
            systemLogService.logAction(
                    user.getUserId(),
                    user.getRole().name(),
                    "LOGOUT",
                    "认证管理",
                    (user.isAdmin() ? "管理员" : "司机") + "退出登录: " + user.getRealName(),
                    "SUCCESS",
                    request
            );
        }
        authService.logout();
        return ApiResult.success();
    }
}
