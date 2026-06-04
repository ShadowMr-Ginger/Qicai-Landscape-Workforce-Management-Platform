package com.green.module.driver.controller;

import com.green.common.result.ApiResult;
import com.green.module.auth.dto.AdminResetDriverPasswordDTO;
import com.green.module.auth.dto.DriverChangePasswordDTO;
import com.green.module.driver.service.DriverService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * 司机控制器
 *
 * <p>处理司机相关的 HTTP 请求，包括司机修改密码、管理员重置司机密码。</p>
 *
 * <h3>接口清单</h3>
 * <ul>
 *     <li>POST /api/driver/change-password — 司机修改自己的密码（需 DRIVER 角色）</li>
 *     <li>POST /api/admin/driver/reset-password — 管理员重置司机密码（需 ADMIN 角色）</li>
 * </ul>
 *
 * @author Green Team
 * @version 1.0.0
 */
@RestController
@RequiredArgsConstructor
public class DriverController {

    private final DriverService driverService;

    /**
     * 司机修改密码
     *
     * <p>司机首次登录后，必须通过此接口修改默认密码（123456）。</p>
     * <p>修改成功后，方可访问系统的业务功能。</p>
     *
     * @param dto 修改密码参数（旧密码 + 新密码）
     * @return 操作成功
     */
    @PostMapping("/api/driver/change-password")
    @PreAuthorize("hasRole('DRIVER')")
    public ApiResult<Void> changePassword(@RequestBody @Valid DriverChangePasswordDTO dto) {
        driverService.changePassword(dto);
        return ApiResult.success("密码修改成功");
    }

    /**
     * 管理员重置司机密码
     *
     * <p>管理员在后台可将指定司机的密码重置为默认密码 123456。</p>
     * <p>重置后，司机下次登录时必须重新修改密码。</p>
     *
     * @param dto 重置密码参数（司机ID）
     * @return 操作成功
     */
    @PostMapping("/api/admin/driver/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResult<Void> resetPassword(@RequestBody @Valid AdminResetDriverPasswordDTO dto) {
        driverService.resetPassword(dto);
        return ApiResult.success("密码重置成功");
    }
}
