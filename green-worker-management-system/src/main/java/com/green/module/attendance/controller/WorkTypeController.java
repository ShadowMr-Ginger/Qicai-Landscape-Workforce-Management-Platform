package com.green.module.attendance.controller;

import com.green.common.result.ApiResult;
import com.green.common.result.ResultCodeEnum;
import com.green.module.attendance.entity.WorkTypeEntity;
import com.green.module.attendance.service.WorkTypeService;
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

    @GetMapping
    public ApiResult<List<WorkTypeEntity>> list() {
        return ApiResult.success(workTypeService.listAll());
    }

    @PostMapping
    public ApiResult<Long> create(@RequestBody Map<String, String> body) {
        String typeName = body.get("typeName");
        String description = body.get("description");
        if (typeName == null || typeName.trim().isEmpty()) {
            return ApiResult.error(ResultCodeEnum.BAD_REQUEST, "作业类型名称不能为空");
        }
        Long id = workTypeService.create(typeName.trim(), description);
        return ApiResult.success(id);
    }

    @PutMapping("/{id}")
    public ApiResult<Void> update(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String typeName = body.get("typeName");
        String description = body.get("description");
        if (typeName == null || typeName.trim().isEmpty()) {
            return ApiResult.error(ResultCodeEnum.BAD_REQUEST, "作业类型名称不能为空");
        }
        workTypeService.update(id, typeName.trim(), description);
        return ApiResult.success("修改成功");
    }

    @DeleteMapping("/{id}")
    public ApiResult<Void> delete(@PathVariable Long id) {
        workTypeService.delete(id);
        return ApiResult.success("删除成功");
    }
}
