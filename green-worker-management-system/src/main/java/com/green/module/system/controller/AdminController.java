package com.green.module.system.controller;

import com.green.common.result.ApiResult;
import com.green.common.result.ResultCodeEnum;
import com.green.module.system.dto.AdminChangePasswordDTO;
import com.green.module.system.entity.AdminEntity;
import com.green.module.system.mapper.AdminMapper;
import com.green.module.system.service.SystemLogService;
import com.green.utils.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 管理员账户控制器
 *
 * <p>处理管理员自身账号相关操作，如修改密码等。</p>
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminMapper adminMapper;
    private final PasswordEncoder passwordEncoder;
    private final SystemLogService systemLogService;

    /**
     * 修改当前管理员密码
     *
     * @param dto     密码修改参数
     * @param request HTTP 请求
     * @return 操作结果
     */
    @PostMapping("/change-password")
    public ApiResult<Void> changePassword(@RequestBody @Valid AdminChangePasswordDTO dto, HttpServletRequest request) {
        Long adminId = SecurityUtils.getCurrentUserId();
        AdminEntity admin = adminMapper.selectById(adminId);
        if (admin == null) {
            return ApiResult.error(ResultCodeEnum.NOT_FOUND, "管理员不存在");
        }

        // 校验原密码
        if (!passwordEncoder.matches(dto.getOldPassword(), admin.getPassword())) {
            return ApiResult.error(ResultCodeEnum.OLD_PASSWORD_ERROR);
        }

        // 更新为新密码
        AdminEntity update = new AdminEntity();
        update.setId(adminId);
        update.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        adminMapper.updateById(update);

        systemLogService.logAction(adminId, admin.getRealName(), "ADMIN", "UPDATE",
                "账号安全", "管理员修改密码", "SUCCESS", request);

        return ApiResult.success("密码修改成功");
    }
}
