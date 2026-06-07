package com.green.module.project.controller;

import com.green.common.result.ApiResult;
import com.green.common.result.ResultCodeEnum;
import com.green.module.project.entity.ProjectEntity;
import com.green.module.project.service.ProjectService;
import com.green.module.system.service.SystemLogService;
import com.green.utils.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 项目管理控制器
 */
@RestController
@RequestMapping("/api/admin/projects")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ProjectController {

    private final ProjectService projectService;
    private final SystemLogService systemLogService;

    @GetMapping
    public ApiResult<?> list(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String keyword) {
        return ApiResult.success(projectService.list(pageNum, pageSize, keyword));
    }

    @GetMapping("/all")
    public ApiResult<List<ProjectEntity>> listAllActive() {
        return ApiResult.success(projectService.listAllActive());
    }

    @GetMapping("/{id}")
    public ApiResult<ProjectEntity> detail(@PathVariable Long id) {
        return ApiResult.success(projectService.detail(id));
    }

    @PostMapping
    public ApiResult<Long> create(@RequestBody Map<String, String> body, HttpServletRequest request) {
        String projectName = body.get("projectName");
        if (!org.springframework.util.StringUtils.hasText(projectName)) {
            return ApiResult.error(ResultCodeEnum.BAD_REQUEST, "项目名称不能为空");
        }
        ProjectEntity entity = new ProjectEntity();
        entity.setProjectName(projectName.trim());
        entity.setProjectAddress(body.get("projectAddress"));
        String startDate = body.get("startDate");
        String endDate = body.get("endDate");
        if (startDate != null && !startDate.isEmpty()) {
            entity.setStartDate(java.time.LocalDate.parse(startDate));
        }
        if (endDate != null && !endDate.isEmpty()) {
            entity.setEndDate(java.time.LocalDate.parse(endDate));
        }
        Long id = projectService.create(entity);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "CREATE",
                "项目管理", "新增项目: " + projectName, "SUCCESS", request);
        return ApiResult.success(id);
    }

    @PutMapping("/{id}")
    public ApiResult<Void> update(@PathVariable Long id, @RequestBody Map<String, String> body, HttpServletRequest request) {
        String projectName = body.get("projectName");
        if (!org.springframework.util.StringUtils.hasText(projectName)) {
            return ApiResult.error(ResultCodeEnum.BAD_REQUEST, "项目名称不能为空");
        }
        ProjectEntity entity = new ProjectEntity();
        entity.setId(id);
        entity.setProjectName(projectName.trim());
        entity.setProjectAddress(body.get("projectAddress"));
        String startDate = body.get("startDate");
        String endDate = body.get("endDate");
        if (startDate != null && !startDate.isEmpty()) {
            entity.setStartDate(java.time.LocalDate.parse(startDate));
        }
        if (endDate != null && !endDate.isEmpty()) {
            entity.setEndDate(java.time.LocalDate.parse(endDate));
        }
        projectService.update(entity);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "UPDATE",
                "项目管理", "修改项目: " + projectName + "(ID=" + id + ")", "SUCCESS", request);
        return ApiResult.success("修改成功");
    }

    @DeleteMapping("/{id}")
    public ApiResult<Void> delete(@PathVariable Long id, HttpServletRequest request) {
        projectService.delete(id);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "DELETE",
                "项目管理", "删除项目(ID=" + id + ")", "SUCCESS", request);
        return ApiResult.success("删除成功");
    }
}
