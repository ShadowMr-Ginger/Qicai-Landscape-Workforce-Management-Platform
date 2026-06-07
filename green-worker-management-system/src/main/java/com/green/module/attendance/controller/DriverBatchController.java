package com.green.module.attendance.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.green.common.enums.BatchStatusEnum;
import com.green.common.exception.BusinessException;
import com.green.common.result.ApiResult;
import com.green.common.result.ResultCodeEnum;
import com.green.module.attendance.dto.CreateBatchDTO;
import com.green.module.attendance.entity.AttendanceBatchEntity;
import com.green.module.attendance.mapper.AttendanceBatchMapper;
import com.green.module.attendance.service.AttendanceService;
import com.green.module.attendance.vo.BatchDetailVO;
import com.green.module.attendance.vo.BatchListVO;
import com.green.module.system.service.SystemLogService;
import com.green.security.LoginUser;
import com.green.utils.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 司机端考勤批次控制器
 *
 * <p>司机小程序专用接口，处理司机上报考勤批次、查看自己的批次记录、撤回/删除未审核批次。</p>
 */
@RestController
@RequestMapping("/api/driver/batches")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DRIVER')")
public class DriverBatchController {

    private final AttendanceService attendanceService;
    private final AttendanceBatchMapper batchMapper;
    private final SystemLogService systemLogService;

    /**
     * 司机创建考勤批次
     *
     * <p>审核司机自动为当前登录司机，考勤日期自动为当天。</p>
     * <p>同时最多保留3条待审核或已撤回的批次。</p>
     */
    @PostMapping
    public ApiResult<Long> createBatch(@RequestBody CreateBatchDTO dto, HttpServletRequest request) {
        LoginUser driver = SecurityUtils.getCurrentUser();
        if (driver == null || !driver.isDriver()) {
            throw new BusinessException(ResultCodeEnum.UNAUTHORIZED);
        }

        // 手动校验
        if (dto.getWorkers() == null || dto.getWorkers().isEmpty()) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "至少选择一名工人");
        }
        if (dto.getAttendanceType() == null) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "出勤类型不能为空");
        }

        // 检查草稿数量限制（待审核+已撤回 ≤ 3）
        long draftCount = countDraftBatches(driver.getUserId());
        if (draftCount >= 3) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST,
                    "您已有3条待处理批次，请先等待审核或删除草稿后再提交");
        }

        // 强制设置司机ID和日期
        dto.setDriverId(driver.getUserId());
        dto.setBatchDate(LocalDate.now());

        Long batchId = attendanceService.createBatchByAdmin(dto);

        systemLogService.logAction(driver.getUserId(), driver.getRealName(), "DRIVER", "CREATE",
                "考勤批次", "司机提交考勤批次(ID=" + batchId + ")", "SUCCESS", request);

        return ApiResult.success(batchId);
    }

    /**
     * 司机查看自己的批次列表
     */
    @GetMapping
    public ApiResult<List<BatchListVO>> listMyBatches(
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {

        LoginUser driver = SecurityUtils.getCurrentUser();
        if (driver == null || !driver.isDriver()) {
            throw new BusinessException(ResultCodeEnum.UNAUTHORIZED);
        }

        com.green.module.attendance.dto.BatchQuery query = new com.green.module.attendance.dto.BatchQuery();
        query.setPageNum(1);
        query.setPageSize(100);
        query.setDriverId(driver.getUserId());
        query.setStatus(status);
        query.setDateFrom(dateFrom);
        query.setDateTo(dateTo);

        IPage<BatchListVO> page = attendanceService.listBatches(query);
        return ApiResult.success(page.getRecords());
    }

    /**
     * 司机编辑并重新提交已撤回的批次
     */
    @PutMapping("/{id}")
    public ApiResult<Void> updateBatch(@PathVariable Long id, @RequestBody CreateBatchDTO dto, HttpServletRequest request) {
        LoginUser driver = SecurityUtils.getCurrentUser();
        if (driver == null || !driver.isDriver()) {
            throw new BusinessException(ResultCodeEnum.UNAUTHORIZED);
        }

        AttendanceBatchEntity batch = batchMapper.selectById(id);
        if (batch == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "批次不存在");
        }
        if (!batch.getDriverId().equals(driver.getUserId())) {
            throw new BusinessException(ResultCodeEnum.FORBIDDEN, "无权操作此批次");
        }

        dto.setDriverId(driver.getUserId());
        dto.setBatchDate(LocalDate.now());
        attendanceService.updateBatch(id, dto);

        systemLogService.logAction(driver.getUserId(), driver.getRealName(), "DRIVER", "UPDATE",
                "考勤批次", "司机重新提交批次(ID=" + id + ")", "SUCCESS", request);

        return ApiResult.success("重新提交成功");
    }

    /**
     * 司机查看批次详情
     */
    @GetMapping("/{id}")
    public ApiResult<BatchDetailVO> batchDetail(@PathVariable Long id) {
        LoginUser driver = SecurityUtils.getCurrentUser();
        BatchDetailVO detail = attendanceService.batchDetail(id);
        if (detail == null || !detail.getDriverId().equals(driver.getUserId())) {
            throw new BusinessException(ResultCodeEnum.FORBIDDEN, "无权查看此批次");
        }
        return ApiResult.success(detail);
    }

    /**
     * 司机撤回批次
     *
     * <p>仅允许撤回状态为"待审核"的批次。</p>
     */
    @PutMapping("/{id}/withdraw")
    public ApiResult<Void> withdrawBatch(@PathVariable Long id, HttpServletRequest request) {
        LoginUser driver = SecurityUtils.getCurrentUser();
        AttendanceBatchEntity batch = batchMapper.selectById(id);
        if (batch == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "批次不存在");
        }
        if (!batch.getDriverId().equals(driver.getUserId())) {
            throw new BusinessException(ResultCodeEnum.FORBIDDEN, "无权操作此批次");
        }
        if (!BatchStatusEnum.PENDING.getCode().equals(batch.getStatus())) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "只有待审核的批次可以撤回");
        }

        batch.setStatus(BatchStatusEnum.WITHDRAWN.getCode());
        batchMapper.updateById(batch);

        systemLogService.logAction(driver.getUserId(), driver.getRealName(), "DRIVER", "UPDATE",
                "考勤批次", "司机撤回批次(ID=" + id + ")", "SUCCESS", request);

        return ApiResult.success("撤回成功");
    }

    /**
     * 司机删除批次
     *
     * <p>仅允许删除"已撤回"或"不通过"状态的批次。</p>
     */
    @DeleteMapping("/{id}")
    public ApiResult<Void> deleteBatch(@PathVariable Long id, HttpServletRequest request) {
        LoginUser driver = SecurityUtils.getCurrentUser();
        AttendanceBatchEntity batch = batchMapper.selectById(id);
        if (batch == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "批次不存在");
        }
        if (!batch.getDriverId().equals(driver.getUserId())) {
            throw new BusinessException(ResultCodeEnum.FORBIDDEN, "无权操作此批次");
        }
        if (!BatchStatusEnum.WITHDRAWN.getCode().equals(batch.getStatus())
                && !BatchStatusEnum.REJECTED.getCode().equals(batch.getStatus())) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "只能删除已撤回或不通过的批次");
        }

        attendanceService.deleteBatch(id);

        systemLogService.logAction(driver.getUserId(), driver.getRealName(), "DRIVER", "DELETE",
                "考勤批次", "司机删除批次(ID=" + id + ")", "SUCCESS", request);

        return ApiResult.success("删除成功");
    }

    /**
     * 统计司机的草稿批次数量（待审核+已撤回）
     */
    private long countDraftBatches(Long driverId) {
        com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<AttendanceBatchEntity> wrapper =
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<>();
        wrapper.eq(AttendanceBatchEntity::getDriverId, driverId)
                .and(w -> w.eq(AttendanceBatchEntity::getStatus, BatchStatusEnum.PENDING.getCode())
                        .or()
                        .eq(AttendanceBatchEntity::getStatus, BatchStatusEnum.WITHDRAWN.getCode()));
        return batchMapper.selectCount(wrapper);
    }
}
