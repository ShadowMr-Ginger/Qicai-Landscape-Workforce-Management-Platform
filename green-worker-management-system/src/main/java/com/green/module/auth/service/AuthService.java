package com.green.module.auth.service;

import com.green.common.result.ApiResult;
import com.green.module.auth.dto.AdminLoginDTO;
import com.green.module.auth.dto.DriverLoginDTO;
import com.green.module.auth.vo.CurrentUserVO;
import com.green.module.auth.vo.DriverLoginVO;
import com.green.module.auth.vo.LoginVO;

/**
 * 认证服务接口
 *
 * <p>负责登录认证、获取当前用户、退出登录等核心认证能力。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
public interface AuthService {

    /**
     * 管理员登录
     *
     * <p>校验账号密码，成功后返回 JWT Token 和管理员信息。</p>
     *
     * @param dto 管理员登录参数
     * @return 登录成功结果
     */
    LoginVO adminLogin(AdminLoginDTO dto);

    /**
     * 司机登录
     *
     * <p>校验姓名和密码，成功后返回 JWT Token、首次登录标识和司机信息。</p>
     *
     * @param dto 司机登录参数
     * @return 登录成功结果（含 firstLogin 字段）
     */
    DriverLoginVO driverLogin(DriverLoginDTO dto);

    /**
     * 获取当前登录用户信息
     *
     * <p>从 SecurityContext 中提取当前用户，转换为前端需要的格式。</p>
     *
     * @return 当前用户信息
     */
    CurrentUserVO getCurrentUser();

    /**
     * 退出登录
     *
     * <p>本系统采用 JWT 无状态认证，后端不维护会话。
     * 退出登录仅返回成功，前端删除本地 Token 即可。</p>
     */
    void logout();
}
