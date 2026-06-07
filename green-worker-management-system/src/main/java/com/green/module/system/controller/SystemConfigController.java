package com.green.module.system.controller;

import com.green.common.result.ApiResult;
import com.green.module.system.entity.SystemConfigEntity;
import com.green.module.system.service.SystemConfigService;
import com.green.module.system.service.SystemLogService;
import com.green.utils.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * 系统配置控制器
 */
@RestController
@RequestMapping("/api/admin/system-configs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SystemConfigController {

    private final SystemConfigService systemConfigService;
    private final SystemLogService systemLogService;

    @GetMapping("/{key}")
    public ApiResult<String> getConfig(@PathVariable String key) {
        String value = systemConfigService.getValue(key);
        return ApiResult.success(value);
    }

    @PutMapping("/{key}")
    public ApiResult<Void> updateConfig(@PathVariable String key, @RequestBody String value, HttpServletRequest request) {
        systemConfigService.setValue(key, value);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "UPDATE",
                "系统配置", "更新配置: " + key + "=" + value, "SUCCESS", request);
        return ApiResult.success("更新成功");
    }
}
