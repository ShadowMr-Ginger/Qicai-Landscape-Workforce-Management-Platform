package com.green.module.worker.controller;

import com.green.common.result.ApiResult;
import com.green.module.system.service.SystemLogService;
import com.green.module.worker.dto.CreateWorkerDTO;
import com.green.module.worker.dto.UpdateWorkerDTO;
import com.green.module.worker.dto.WorkerQuery;
import com.green.module.worker.service.WorkerService;
import com.green.module.worker.vo.WorkerDetailVO;
import com.green.module.worker.vo.WorkerListVO;
import com.green.utils.SecurityUtils;
import com.baomidou.mybatisplus.core.metadata.IPage;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * 工人管理控制器
 *
 * <p>提供工人列表查询、详情查看、信息修改、离职、删除等接口。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
@RestController
@RequestMapping("/api/admin/workers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class WorkerController {

    private final WorkerService workerService;
    private final SystemLogService systemLogService;

    /**
     * 新增工人
     *
     * @param dto 新增参数
     * @return 工人ID
     */
    @PostMapping
    public ApiResult<Long> create(@RequestBody @Valid CreateWorkerDTO dto, HttpServletRequest request) {
        Long id = workerService.create(dto);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "CREATE",
                "工人管理", "新增工人: " + dto.getName(), "SUCCESS", request);
        return ApiResult.success(id);
    }

    /**
     * 查询工人列表
     *
     * @param query 查询参数
     * @return 分页列表
     */
    @GetMapping
    public ApiResult<IPage<WorkerListVO>> list(WorkerQuery query) {
        IPage<WorkerListVO> page = workerService.list(query);
        return ApiResult.success(page);
    }

    /**
     * 查询工人详情
     *
     * @param id 工人ID
     * @return 详情信息
     */
    @GetMapping("/{id}")
    public ApiResult<WorkerDetailVO> detail(@PathVariable Long id) {
        WorkerDetailVO vo = workerService.detail(id);
        return ApiResult.success(vo);
    }

    /**
     * 修改工人信息
     *
     * @param id  工人ID
     * @param dto 修改参数
     * @return 操作成功
     */
    @PutMapping("/{id}")
    public ApiResult<Void> update(@PathVariable Long id, @RequestBody @Valid UpdateWorkerDTO dto, HttpServletRequest request) {
        workerService.update(id, dto);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "UPDATE",
                "工人管理", "修改工人信息: " + dto.getName() + "(ID=" + id + ")", "SUCCESS", request);
        return ApiResult.success("修改成功");
    }

    /**
     * 工人离职
     *
     * @param id 工人ID
     * @return 操作成功
     */
    @PutMapping("/{id}/resign")
    public ApiResult<Void> resign(@PathVariable Long id, HttpServletRequest request) {
        workerService.resign(id);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "UPDATE",
                "工人管理", "设置工人离职(ID=" + id + ")", "SUCCESS", request);
        return ApiResult.success("已设置为离职状态");
    }

    /**
     * 删除工人
     *
     * @param id 工人ID
     * @return 关联考勤记录数量（用于前端警告提示）
     */
    @DeleteMapping("/{id}")
    public ApiResult<Integer> delete(@PathVariable Long id, HttpServletRequest request) {
        int attendanceCount = workerService.deleteWorker(id);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "DELETE",
                "工人管理", "删除工人(ID=" + id + ")", "SUCCESS", request);
        return ApiResult.success("删除成功", attendanceCount);
    }
}
