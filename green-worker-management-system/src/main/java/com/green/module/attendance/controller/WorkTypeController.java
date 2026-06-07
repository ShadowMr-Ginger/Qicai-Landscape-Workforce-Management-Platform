package com.green.module.attendance.controller;

import com.green.common.result.ApiResult;
import com.green.common.result.ResultCodeEnum;
import com.green.module.attendance.entity.WorkTypeEntity;
import com.green.module.attendance.service.WorkTypeService;
import com.green.module.system.service.SystemLogService;
import com.green.utils.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 作业类型管理控制器
 */
@RestController
@RequestMapping("/api/admin/work-types")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class WorkTypeController {

    private final WorkTypeService workTypeService;
    private final SystemLogService systemLogService;

    @GetMapping
    public ApiResult<List<WorkTypeEntity>> list() {
        return ApiResult.success(workTypeService.listAll());
    }

    @PostMapping
    public ApiResult<Long> create(@RequestBody Map<String, String> body, HttpServletRequest request) {
        String typeName = body.get("typeName");
        String description = body.get("description");
        if (typeName == null || typeName.trim().isEmpty()) {
            return ApiResult.error(ResultCodeEnum.BAD_REQUEST, "作业类型名称不能为空");
        }
        Long id = workTypeService.create(typeName.trim(), description);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "CREATE",
                "作业类型管理", "新增作业类型: " + typeName, "SUCCESS", request);
        return ApiResult.success(id);
    }

    @PutMapping("/{id}")
    public ApiResult<Void> update(@PathVariable Long id, @RequestBody Map<String, String> body, HttpServletRequest request) {
        String typeName = body.get("typeName");
        String description = body.get("description");
        if (typeName == null || typeName.trim().isEmpty()) {
            return ApiResult.error(ResultCodeEnum.BAD_REQUEST, "作业类型名称不能为空");
        }
        workTypeService.update(id, typeName.trim(), description);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "UPDATE",
                "作业类型管理", "修改作业类型: " + typeName + "(ID=" + id + ")", "SUCCESS", request);
        return ApiResult.success("修改成功");
    }

    @DeleteMapping("/{id}")
    public ApiResult<Void> delete(@PathVariable Long id, HttpServletRequest request) {
        workTypeService.delete(id);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "DELETE",
                "作业类型管理", "删除作业类型(ID=" + id + ")", "SUCCESS", request);
        return ApiResult.success("删除成功");
    }
}
