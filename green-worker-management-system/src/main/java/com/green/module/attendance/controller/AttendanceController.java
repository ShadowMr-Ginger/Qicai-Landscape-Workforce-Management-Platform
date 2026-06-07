package com.green.module.attendance.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.green.common.result.ApiResult;
import com.green.module.attendance.dto.BatchQuery;
import com.green.module.attendance.dto.CreateBatchDTO;
import com.green.module.attendance.dto.DriverRecordQuery;
import com.green.module.attendance.dto.ReviewBatchDTO;
import com.green.module.attendance.dto.SettleDTO;
import com.green.module.attendance.dto.UpdateDriverRecordDTO;
import com.green.module.attendance.dto.UpdateWorkerRecordDTO;
import com.green.module.attendance.dto.WorkerRecordQuery;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.green.module.attendance.entity.AttendanceBatchEntity;
import com.green.module.attendance.entity.DriverAttendanceRecordEntity;
import com.green.module.attendance.entity.WorkerAttendanceRecordEntity;
import com.green.module.attendance.mapper.AttendanceBatchMapper;
import com.green.module.attendance.mapper.DriverAttendanceRecordMapper;
import com.green.module.attendance.mapper.WorkerAttendanceRecordMapper;
import com.green.module.attendance.service.AttendanceService;
import com.green.module.attendance.vo.*;
import com.green.module.driver.entity.DriverEntity;
import com.green.module.driver.mapper.DriverMapper;
import com.green.module.system.service.SystemLogService;
import com.green.module.worker.entity.WorkerEntity;
import com.green.module.worker.mapper.WorkerMapper;
import com.green.utils.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

/**
 * 考勤管理控制器
 */
@RestController
@RequestMapping("/api/admin/attendance")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final SystemLogService systemLogService;
    private final AttendanceBatchMapper batchMapper;
    private final WorkerAttendanceRecordMapper workerRecordMapper;
    private final DriverAttendanceRecordMapper driverRecordMapper;
    private final WorkerMapper workerMapper;
    private final DriverMapper driverMapper;

    // ==================== 考勤批次 ====================

    @GetMapping("/batches")
    public ApiResult<IPage<BatchListVO>> listBatches(BatchQuery query) {
        return ApiResult.success(attendanceService.listBatches(query));
    }

    @GetMapping("/batches/{id}")
    public ApiResult<BatchDetailVO> batchDetail(@PathVariable Long id) {
        return ApiResult.success(attendanceService.batchDetail(id));
    }

    @PostMapping("/batches")
    public ApiResult<Long> createBatch(@RequestBody @Valid CreateBatchDTO dto, HttpServletRequest request) {
        Long id = attendanceService.createBatchByAdmin(dto);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "CREATE",
                "考勤管理", "新建考勤批次(ID=" + id + ", 日期=" + dto.getBatchDate() + ")", "SUCCESS", request);
        return ApiResult.success(id);
    }

    @PutMapping("/batches/{id}/approve")
    public ApiResult<Void> approveBatch(@PathVariable Long id, HttpServletRequest request) {
        attendanceService.approveBatch(id);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "REVIEW",
                "考勤管理", "审核通过批次(ID=" + id + ")", "SUCCESS", request);
        return ApiResult.success("审核通过");
    }

    @PutMapping("/batches/{id}/review")
    public ApiResult<Void> reviewBatch(@PathVariable Long id, @RequestBody @Valid ReviewBatchDTO dto, HttpServletRequest request) {
        dto.setBatchId(id);
        attendanceService.reviewBatch(dto);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "REVIEW",
                "考勤管理", "审核通过批次(ID=" + id + ")", "SUCCESS", request);
        return ApiResult.success("审核通过");
    }

    @PutMapping("/batches/{id}/reject")
    public ApiResult<Void> rejectBatch(@PathVariable Long id, HttpServletRequest request) {
        attendanceService.rejectBatch(id);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "REVIEW",
                "考勤管理", "审核不通过批次(ID=" + id + ")", "SUCCESS", request);
        return ApiResult.success("已设为不通过");
    }

    @DeleteMapping("/batches/{id}")
    public ApiResult<Void> deleteBatch(@PathVariable Long id, HttpServletRequest request) {
        attendanceService.deleteBatch(id);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "DELETE",
                "考勤管理", "删除考勤批次(ID=" + id + ")", "SUCCESS", request);
        return ApiResult.success("删除成功");
    }

    // ==================== 工人考勤记录 ====================

    @GetMapping("/worker-records")
    public ApiResult<IPage<WorkerAttendanceRecordVO>> listWorkerRecords(WorkerRecordQuery query) {
        return ApiResult.success(attendanceService.listWorkerRecords(query));
    }

    @GetMapping("/worker-records/{id}")
    public ApiResult<WorkerAttendanceRecordVO> workerRecordDetail(@PathVariable Long id) {
        return ApiResult.success(attendanceService.workerRecordDetail(id));
    }

    @PutMapping("/worker-records/{id}")
    public ApiResult<Void> updateWorkerRecord(@PathVariable Long id, @RequestBody @Valid UpdateWorkerRecordDTO dto, HttpServletRequest request) {
        attendanceService.updateWorkerRecord(id, dto);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "UPDATE",
                "考勤管理", "修改工人考勤记录(ID=" + id + ")", "SUCCESS", request);
        return ApiResult.success("更新成功");
    }

    @DeleteMapping("/worker-records/{id}")
    public ApiResult<Void> deleteWorkerRecord(@PathVariable Long id, HttpServletRequest request) {
        attendanceService.deleteWorkerRecord(id);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "DELETE",
                "考勤管理", "删除工人考勤记录(ID=" + id + ")", "SUCCESS", request);
        return ApiResult.success("删除成功");
    }

    @GetMapping("/workers/{workerId}/calendar")
    public ApiResult<Map<String, Object>> getWorkerCalendar(
            @PathVariable Long workerId,
            @RequestParam Integer year,
            @RequestParam Integer month) {
        return ApiResult.success(attendanceService.getWorkerCalendar(workerId, year, month));
    }

    // ==================== 司机考勤记录 ====================

    @GetMapping("/driver-records")
    public ApiResult<IPage<DriverAttendanceRecordVO>> listDriverRecords(DriverRecordQuery query) {
        return ApiResult.success(attendanceService.listDriverRecords(query));
    }

    @GetMapping("/driver-records/{id}")
    public ApiResult<DriverAttendanceRecordVO> driverRecordDetail(@PathVariable Long id) {
        return ApiResult.success(attendanceService.driverRecordDetail(id));
    }

    @PutMapping("/driver-records/{id}")
    public ApiResult<Void> updateDriverRecord(@PathVariable Long id, @RequestBody @Valid UpdateDriverRecordDTO dto, HttpServletRequest request) {
        attendanceService.updateDriverRecord(id, dto);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "UPDATE",
                "考勤管理", "修改司机考勤记录(ID=" + id + ")", "SUCCESS", request);
        return ApiResult.success("更新成功");
    }

    @DeleteMapping("/driver-records/{id}")
    public ApiResult<Void> deleteDriverRecord(@PathVariable Long id, HttpServletRequest request) {
        attendanceService.deleteDriverRecord(id);
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "DELETE",
                "考勤管理", "删除司机考勤记录(ID=" + id + ")", "SUCCESS", request);
        return ApiResult.success("删除成功");
    }

    @GetMapping("/drivers/{driverId}/calendar")
    public ApiResult<Map<String, Object>> getDriverCalendar(
            @PathVariable Long driverId,
            @RequestParam Integer year,
            @RequestParam Integer month) {
        return ApiResult.success(attendanceService.getDriverCalendar(driverId, year, month));
    }

    @GetMapping("/workers/{workerId}/wage-summary")
    public ApiResult<WageSummaryVO> getWorkerWageSummary(@PathVariable Long workerId) {
        return ApiResult.success(attendanceService.getWorkerWageSummary(workerId));
    }

    @GetMapping("/drivers/{driverId}/wage-summary")
    public ApiResult<WageSummaryVO> getDriverWageSummary(@PathVariable Long driverId) {
        return ApiResult.success(attendanceService.getDriverWageSummary(driverId));
    }

    @PostMapping("/workers/{workerId}/settle-preview")
    public ApiResult<SettlePreviewVO> previewWorkerSettle(@PathVariable Long workerId,
                                                           @RequestParam String dateFrom,
                                                           @RequestParam String dateTo) {
        return ApiResult.success(attendanceService.previewWorkerSettle(workerId, LocalDate.parse(dateFrom), LocalDate.parse(dateTo)));
    }

    @PostMapping("/workers/{workerId}/settle")
    public ApiResult<Void> settleWorkerRecords(@PathVariable Long workerId,
                                                @RequestBody @Valid SettleDTO dto, HttpServletRequest request) {
        attendanceService.settleWorkerRecords(workerId, dto.getDateFrom(), dto.getDateTo());
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "SETTLE",
                "工资结算", "结清工人工资: workerId=" + workerId + ", 范围=" + dto.getDateFrom() + "~" + dto.getDateTo(), "SUCCESS", request);
        return ApiResult.success("结算成功");
    }

    @PostMapping("/drivers/{driverId}/settle-preview")
    public ApiResult<SettlePreviewVO> previewDriverSettle(@PathVariable Long driverId,
                                                           @RequestParam String dateFrom,
                                                           @RequestParam String dateTo) {
        return ApiResult.success(attendanceService.previewDriverSettle(driverId, LocalDate.parse(dateFrom), LocalDate.parse(dateTo)));
    }

    @PostMapping("/drivers/{driverId}/settle")
    public ApiResult<Void> settleDriverRecords(@PathVariable Long driverId,
                                                @RequestBody @Valid SettleDTO dto, HttpServletRequest request) {
        attendanceService.settleDriverRecords(driverId, dto.getDateFrom(), dto.getDateTo());
        systemLogService.logAction(SecurityUtils.getCurrentUserId(), "ADMIN", "SETTLE",
                "工资结算", "结清司机工资: driverId=" + driverId + ", 范围=" + dto.getDateFrom() + "~" + dto.getDateTo(), "SUCCESS", request);
        return ApiResult.success("结算成功");
    }

    // ==================== Dashboard 统计 ====================

    @GetMapping("/dashboard/stats")
    public ApiResult<Map<String, Object>> dashboardStats() {
        LocalDate today = LocalDate.now();

        // 待审核批次数量
        LambdaQueryWrapper<AttendanceBatchEntity> batchWrapper = new LambdaQueryWrapper<>();
        batchWrapper.eq(AttendanceBatchEntity::getStatus, 0);
        long pendingCount = batchMapper.selectCount(batchWrapper);

        // 今日工人考勤记录数
        LambdaQueryWrapper<WorkerAttendanceRecordEntity> workerWrapper = new LambdaQueryWrapper<>();
        workerWrapper.eq(WorkerAttendanceRecordEntity::getAttendanceDate, today);
        long todayWorkerRecords = workerRecordMapper.selectCount(workerWrapper);

        // 今日司机考勤记录数
        LambdaQueryWrapper<DriverAttendanceRecordEntity> driverWrapper = new LambdaQueryWrapper<>();
        driverWrapper.eq(DriverAttendanceRecordEntity::getAttendanceDate, today);
        long todayDriverRecords = driverRecordMapper.selectCount(driverWrapper);

        // 工人总数（在职）
        LambdaQueryWrapper<WorkerEntity> workerTotalWrapper = new LambdaQueryWrapper<>();
        workerTotalWrapper.eq(WorkerEntity::getIsEmployed, 1);
        long totalWorkers = workerMapper.selectCount(workerTotalWrapper);

        // 司机总数（在职）
        LambdaQueryWrapper<DriverEntity> driverTotalWrapper = new LambdaQueryWrapper<>();
        driverTotalWrapper.eq(DriverEntity::getIsActive, 1);
        long totalDrivers = driverMapper.selectCount(driverTotalWrapper);

        Map<String, Object> stats = new HashMap<>();
        stats.put("pendingCount", pendingCount);
        stats.put("todayWorkerRecords", todayWorkerRecords);
        stats.put("todayDriverRecords", todayDriverRecords);
        stats.put("totalWorkers", totalWorkers);
        stats.put("totalDrivers", totalDrivers);

        return ApiResult.success(stats);
    }
}
