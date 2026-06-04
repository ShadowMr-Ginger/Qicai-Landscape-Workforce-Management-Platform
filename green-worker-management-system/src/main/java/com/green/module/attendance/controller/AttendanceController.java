package com.green.module.attendance.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.green.common.result.ApiResult;
import com.green.module.attendance.dto.BatchQuery;
import com.green.module.attendance.dto.CreateBatchDTO;
import com.green.module.attendance.dto.DriverRecordQuery;
import com.green.module.attendance.dto.ReviewBatchDTO;
import com.green.module.attendance.dto.WorkerRecordQuery;
import com.green.module.attendance.service.AttendanceService;
import com.green.module.attendance.vo.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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
    public ApiResult<Long> createBatch(@RequestBody @Valid CreateBatchDTO dto) {
        Long id = attendanceService.createBatchByAdmin(dto);
        return ApiResult.success(id);
    }

    @PutMapping("/batches/{id}/approve")
    public ApiResult<Void> approveBatch(@PathVariable Long id) {
        attendanceService.approveBatch(id);
        return ApiResult.success("审核通过");
    }

    @PutMapping("/batches/{id}/review")
    public ApiResult<Void> reviewBatch(@PathVariable Long id, @RequestBody @Valid ReviewBatchDTO dto) {
        dto.setBatchId(id);
        attendanceService.reviewBatch(dto);
        return ApiResult.success("审核通过");
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

    @GetMapping("/drivers/{driverId}/calendar")
    public ApiResult<Map<String, Object>> getDriverCalendar(
            @PathVariable Long driverId,
            @RequestParam Integer year,
            @RequestParam Integer month) {
        return ApiResult.success(attendanceService.getDriverCalendar(driverId, year, month));
    }
}
