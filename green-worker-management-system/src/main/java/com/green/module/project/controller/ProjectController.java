package com.green.module.project.controller;

import com.green.common.result.ApiResult;
import com.green.common.result.ResultCodeEnum;
import com.green.module.project.dto.CreateProjectDTO;
import com.green.module.project.dto.UpdateProjectDTO;
import com.green.module.project.service.ProjectService;
import com.green.module.project.vo.ProjectVO;
import com.green.module.system.service.SystemLogService;
import com.green.utils.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
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
    public ApiResult<List<ProjectVO>> listAllActive() {
        return ApiResult.success(projectService.listAllActive());
    }

    @GetMapping("/{id}")
    public ApiResult<ProjectVO> detail(@PathVariable Long id) {
        return ApiResult.success(projectService.detail(id));
    }

    @PostMapping
    public ApiResult<Long> create(@Valid @RequestBody CreateProjectDTO dto, HttpServletRequest request) {
        Long id = projectService.create(dto);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "CREATE",
                "项目管理", "新增项目: " + dto.getProjectName(), "SUCCESS", request);
        return ApiResult.success(id);
    }

    @PutMapping("/{id}")
    public ApiResult<Void> update(@PathVariable Long id, @Valid @RequestBody UpdateProjectDTO dto, HttpServletRequest request) {
        projectService.update(id, dto);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "UPDATE",
                "项目管理", "修改项目(ID=" + id + ")", "SUCCESS", request);
        return ApiResult.success("修改成功");
    }

    @DeleteMapping("/{id}")
    public ApiResult<Void> delete(@PathVariable Long id, HttpServletRequest request) {
        projectService.delete(id);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "DELETE",
                "项目管理", "删除项目(ID=" + id + ")", "SUCCESS", request);
        return ApiResult.success("删除成功");
    }

    @PostMapping("/{id}/close")
    public ApiResult<Void> closeProject(@PathVariable Long id, HttpServletRequest request) {
        projectService.closeProject(id);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "UPDATE",
                "项目管理", "结项项目(ID=" + id + ")", "SUCCESS", request);
        return ApiResult.success("结项成功");
    }

    @PostMapping("/{id}/reopen")
    public ApiResult<Void> reopenProject(@PathVariable Long id, HttpServletRequest request) {
        projectService.reopenProject(id);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "UPDATE",
                "项目管理", "重启项目(ID=" + id + ")", "SUCCESS", request);
        return ApiResult.success("重启成功");
    }

    @GetMapping("/{id}/calendar")
    public ApiResult<Map<String, Object>> getCalendar(
            @PathVariable Long id,
            @RequestParam int year,
            @RequestParam int month) {
        return ApiResult.success(projectService.getProjectCalendar(id, year, month));
    }

    @GetMapping("/today-stats")
    public ApiResult<Map<String, Object>> getTodayStats() {
        return ApiResult.success(projectService.getTodayStats());
    }
}
