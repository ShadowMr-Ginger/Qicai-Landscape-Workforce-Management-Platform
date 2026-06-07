package com.green.module.group.controller;

import com.green.common.result.ApiResult;
import com.green.module.group.dto.CreateGroupDTO;
import com.green.module.group.dto.UpdateGroupDTO;
import com.green.module.group.service.GroupService;
import com.green.module.group.vo.GroupListVO;
import com.green.module.group.vo.GroupWorkerVO;
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
 * 组别管理控制器
 */
@RestController
@RequestMapping("/api/admin/groups")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class GroupController {

    private final GroupService groupService;
    private final SystemLogService systemLogService;

    @PostMapping
    public ApiResult<Long> create(@RequestBody @Valid CreateGroupDTO dto, HttpServletRequest request) {
        Long id = groupService.create(dto);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "CREATE",
                "组别管理", "新增组别: " + dto.getGroupName(), "SUCCESS", request);
        return ApiResult.success(id);
    }

    @PutMapping("/{id}")
    public ApiResult<Void> update(@PathVariable Long id, @RequestBody @Valid UpdateGroupDTO dto, HttpServletRequest request) {
        groupService.update(id, dto);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "UPDATE",
                "组别管理", "修改组别: " + dto.getGroupName() + "(ID=" + id + ")", "SUCCESS", request);
        return ApiResult.success("修改成功");
    }

    @DeleteMapping("/{id}")
    public ApiResult<Void> delete(@PathVariable Long id, @RequestParam Long targetGroupId, HttpServletRequest request) {
        groupService.deleteGroup(id, targetGroupId);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "DELETE",
                "组别管理", "删除组别(ID=" + id + ")", "SUCCESS", request);
        return ApiResult.success("删除成功");
    }

    @GetMapping
    public ApiResult<List<GroupListVO>> list() {
        List<GroupListVO> list = groupService.listAll();
        return ApiResult.success(list);
    }

    @GetMapping("/{id}")
    public ApiResult<GroupListVO> detail(@PathVariable Long id) {
        GroupListVO vo = groupService.detail(id);
        return ApiResult.success(vo);
    }

    @GetMapping("/{id}/workers")
    public ApiResult<List<GroupWorkerVO>> listWorkers(@PathVariable Long id) {
        List<GroupWorkerVO> list = groupService.listWorkers(id);
        return ApiResult.success(list);
    }

    @PutMapping("/{id}/resign-all")
    public ApiResult<Map<String, Object>> resignAll(@PathVariable Long id, HttpServletRequest request) {
        int count = groupService.resignAll(id);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "UPDATE",
                "组别管理", "批量设置离职: 组别ID=" + id + ", 影响" + count + "人", "SUCCESS", request);
        return ApiResult.success(Map.of("affectedCount", count));
    }

    @PutMapping("/{id}/restore-all")
    public ApiResult<Map<String, Object>> restoreAll(@PathVariable Long id, HttpServletRequest request) {
        int count = groupService.restoreAll(id);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "UPDATE",
                "组别管理", "批量恢复在职: 组别ID=" + id + ", 影响" + count + "人", "SUCCESS", request);
        return ApiResult.success(Map.of("affectedCount", count));
    }
}
