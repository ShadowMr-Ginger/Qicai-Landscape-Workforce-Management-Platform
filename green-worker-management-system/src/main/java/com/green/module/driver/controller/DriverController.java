package com.green.module.driver.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import cn.hutool.json.JSONObject;
import com.green.common.result.ApiResult;
import com.green.common.result.ResultCodeEnum;
import com.green.security.JwtTokenProvider;
import com.green.module.auth.dto.AdminResetDriverPasswordDTO;
import com.green.module.auth.dto.DriverChangePasswordDTO;
import com.green.module.driver.dto.CreateDriverDTO;
import com.green.module.driver.dto.DriverQuery;
import com.green.module.auth.dto.DriverWxBindDTO;
import com.green.module.driver.dto.UpdateDriverDTO;
import com.green.module.driver.entity.DriverEntity;
import com.green.module.driver.mapper.DriverMapper;
import com.green.module.attendance.service.WorkTypeService;
import com.green.module.driver.service.DriverService;
import com.green.module.driver.vo.DriverDetailVO;
import com.green.module.driver.vo.DriverListVO;
import com.green.module.system.service.SystemLogService;
import com.green.utils.SecurityUtils;
import com.green.utils.WxApiUtil;
import java.util.List;
import jakarta.servlet.http.HttpServletRequest;
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
    private final SystemLogService systemLogService;
    private final WxApiUtil wxApiUtil;
    private final DriverMapper driverMapper;
    private final JwtTokenProvider jwtTokenProvider;
    private final WorkTypeService workTypeService;

    // ==================== 司机端接口 ====================

    @PostMapping("/api/driver/change-password")
    @PreAuthorize("hasRole('DRIVER')")
    public ApiResult<String> changePassword(@RequestBody @Valid DriverChangePasswordDTO dto, HttpServletRequest request) {
        String newToken = driverService.changePassword(dto);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "DRIVER", "UPDATE",
                "司机账户", "司机修改密码", "SUCCESS", request);
        return ApiResult.success(newToken, "密码修改成功");
    }

    /**
     * 司机端获取作业类型列表
     */
    @GetMapping("/api/driver/work-types")
    @PreAuthorize("hasRole('DRIVER')")
    public ApiResult<List<com.green.module.attendance.entity.WorkTypeEntity>> driverWorkTypes() {
        return ApiResult.success(workTypeService.listAll());
    }

    // ==================== 管理端接口 ====================

    @PostMapping("/api/admin/drivers")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResult<Long> create(@RequestBody @Valid CreateDriverDTO dto, HttpServletRequest request) {
        Long id = driverService.create(dto);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "CREATE",
                "司机管理", "新增司机: " + dto.getRealName(), "SUCCESS", request);
        return ApiResult.success(id);
    }

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
    public ApiResult<Void> update(@PathVariable Long id, @RequestBody @Valid UpdateDriverDTO dto, HttpServletRequest request) {
        driverService.update(id, dto);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "UPDATE",
                "司机管理", "修改司机信息: " + dto.getRealName() + "(ID=" + id + ")", "SUCCESS", request);
        return ApiResult.success("修改成功");
    }

    @PutMapping("/api/admin/drivers/{id}/resign")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResult<Void> resign(@PathVariable Long id, HttpServletRequest request) {
        driverService.resign(id);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "UPDATE",
                "司机管理", "设置司机离职(ID=" + id + ")", "SUCCESS", request);
        return ApiResult.success("已设置为离职状态");
    }

    @GetMapping("/api/admin/drivers/{id}/attendance-count")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResult<Integer> attendanceCount(@PathVariable Long id) {
        return ApiResult.success(driverService.countDriverAttendance(id));
    }

    @DeleteMapping("/api/admin/drivers/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResult<Integer> delete(@PathVariable Long id, HttpServletRequest request) {
        int attendanceCount = driverService.deleteDriver(id);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "DELETE",
                "司机管理", "删除司机(ID=" + id + ")", "SUCCESS", request);
        return ApiResult.success("删除成功", attendanceCount);
    }

    @PostMapping("/api/admin/driver/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResult<Void> resetPassword(@RequestBody @Valid AdminResetDriverPasswordDTO dto, HttpServletRequest request) {
        driverService.resetPassword(dto);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "UPDATE",
                "司机管理", "重置司机密码(ID=" + dto.getDriverId() + ")", "SUCCESS", request);
        return ApiResult.success("密码重置成功");
    }

    // ==================== 司机端微信绑定 ====================

    @PostMapping("/api/driver/bind-wx")
    @PreAuthorize("hasRole('DRIVER')")
    public ApiResult<Void> bindWechat(@RequestBody @Valid DriverWxBindDTO dto, HttpServletRequest request) {
        Long driverId = SecurityUtils.getCurrentUserId();

        // 1. 调用微信接口换取 OpenID
        JSONObject wxResult = wxApiUtil.code2Session(dto.getWxCode());
        if (wxResult == null) {
            return ApiResult.error(ResultCodeEnum.WX_BIND_FAILED, "微信授权失败，请重试");
        }
        String openid = wxResult.getStr("openid");
        if (openid == null || openid.isEmpty()) {
            return ApiResult.error(ResultCodeEnum.WX_BIND_FAILED, "获取微信用户信息失败");
        }

        // 2. 检查 OpenID 是否已被其他司机绑定
        com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<DriverEntity> wrapper =
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<>();
        wrapper.eq(DriverEntity::getWxOpenid, openid)
                .ne(DriverEntity::getId, driverId);
        if (driverMapper.selectCount(wrapper) > 0) {
            return ApiResult.error(ResultCodeEnum.WX_BIND_FAILED, "该微信已绑定其他司机账号");
        }

        // 3. 绑定到当前司机
        DriverEntity driver = new DriverEntity();
        driver.setId(driverId);
        driver.setWxOpenid(openid);
        driver.setWxUnionid(wxResult.getStr("unionid"));
        driverMapper.updateById(driver);

        systemLogService.logAction(driverId, "DRIVER", "UPDATE",
                "微信绑定", "司机绑定微信号", "SUCCESS", request);

        return ApiResult.success("微信绑定成功");
    }
}
