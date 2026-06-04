package com.green.module.driver.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.green.common.result.ApiResult;
import com.green.module.auth.dto.AdminResetDriverPasswordDTO;
import com.green.module.auth.dto.DriverChangePasswordDTO;
import com.green.module.driver.dto.DriverQuery;
import com.green.module.driver.dto.UpdateDriverDTO;
import com.green.module.driver.service.DriverService;
import com.green.module.driver.vo.DriverDetailVO;
import com.green.module.driver.vo.DriverListVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * 司机控制器
 *
 * <p>处理司机相关的 HTTP 请求，包括司机修改密码、管理员重置密码、司机管理 CRUD。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
@RestController
@RequiredArgsConstructor
public class DriverController {

    private final DriverService driverService;

    // ==================== 司机端接口 ====================

    @PostMapping("/api/driver/change-password")
    @PreAuthorize("hasRole('DRIVER')")
    public ApiResult<Void> changePassword(@RequestBody @Valid DriverChangePasswordDTO dto) {
        driverService.changePassword(dto);
        return ApiResult.success("密码修改成功");
    }

    // ==================== 管理端接口 ====================

    @GetMapping("/api/admin/drivers")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResult<IPage<DriverListVO>> list(DriverQuery query) {
        IPage<DriverListVO> page = driverService.list(query);
        return ApiResult.success(page);
    }

    @GetMapping("/api/admin/drivers/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResult<DriverDetailVO> detail(@PathVariable Long id) {
        DriverDetailVO vo = driverService.detail(id);
        return ApiResult.success(vo);
    }

    @PutMapping("/api/admin/drivers/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResult<Void> update(@PathVariable Long id, @RequestBody @Valid UpdateDriverDTO dto) {
        driverService.update(id, dto);
        return ApiResult.success("修改成功");
    }

    @PutMapping("/api/admin/drivers/{id}/resign")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResult<Void> resign(@PathVariable Long id) {
        driverService.resign(id);
        return ApiResult.success("已设置为离职状态");
    }

    @DeleteMapping("/api/admin/drivers/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResult<Integer> delete(@PathVariable Long id) {
        int attendanceCount = driverService.deleteDriver(id);
        return ApiResult.success("删除成功", attendanceCount);
    }

    @PostMapping("/api/admin/driver/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResult<Void> resetPassword(@RequestBody @Valid AdminResetDriverPasswordDTO dto) {
        driverService.resetPassword(dto);
        return ApiResult.success("密码重置成功");
    }
}
