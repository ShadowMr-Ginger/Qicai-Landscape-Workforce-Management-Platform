package com.green.module.driver.controller;

import com.green.common.result.ApiResult;
import com.green.module.driver.service.DriverFavoriteWorkerService;
import com.green.module.system.service.SystemLogService;
import com.green.module.worker.vo.WorkerListVO;
import com.green.security.LoginUser;
import com.green.utils.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 司机常用工人控制器
 */
@RestController
@RequestMapping("/api/driver/favorite-workers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DRIVER')")
public class DriverFavoriteWorkerController {

    private final DriverFavoriteWorkerService favoriteWorkerService;
    private final SystemLogService systemLogService;

    /**
     * 获取常用工人列表
     */
    @GetMapping
    public ApiResult<List<WorkerListVO>> list() {
        Long driverId = SecurityUtils.getCurrentUserId();
        return ApiResult.success(favoriteWorkerService.listFavoriteWorkers(driverId));
    }

    /**
     * 搜索可添加的工人
     */
    @GetMapping("/search")
    public ApiResult<List<WorkerListVO>> search(@RequestParam(required = false) String keyword) {
        Long driverId = SecurityUtils.getCurrentUserId();
        return ApiResult.success(favoriteWorkerService.searchAvailableWorkers(driverId, keyword));
    }

    /**
     * 添加工人到常用列表
     */
    @PostMapping("/{workerId}")
    public ApiResult<Void> add(@PathVariable Long workerId, HttpServletRequest request) {
        Long driverId = SecurityUtils.getCurrentUserId();
        favoriteWorkerService.addFavoriteWorker(driverId, workerId);
        systemLogService.logAction(driverId, "DRIVER", "CREATE",
                "常用工人", "添加常用工人(ID=" + workerId + ")", "SUCCESS", request);
        return ApiResult.success("添加成功");
    }

    /**
     * 从常用列表移除工人
     */
    @DeleteMapping("/{workerId}")
    public ApiResult<Void> remove(@PathVariable Long workerId, HttpServletRequest request) {
        Long driverId = SecurityUtils.getCurrentUserId();
        favoriteWorkerService.removeFavoriteWorker(driverId, workerId);
        systemLogService.logAction(driverId, "DRIVER", "DELETE",
                "常用工人", "移除常用工人(ID=" + workerId + ")", "SUCCESS", request);
        return ApiResult.success("移除成功");
    }
}
