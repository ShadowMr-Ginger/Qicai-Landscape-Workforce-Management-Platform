package com.green.module.system.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.green.common.result.ApiResult;
import com.green.module.system.entity.SystemLogEntity;
import com.green.module.system.service.SystemLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 系统日志控制器
 */
@RestController
@RequestMapping("/api/admin/system-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SystemLogController {

    private final SystemLogService systemLogService;

    @GetMapping
    public ApiResult<IPage<SystemLogEntity>> listLogs(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String userType,
            @RequestParam(required = false) String action) {
        return ApiResult.success(systemLogService.listLogs(pageNum, pageSize, userType, action));
    }
}
