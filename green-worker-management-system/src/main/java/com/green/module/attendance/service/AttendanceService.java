package com.green.module.attendance.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.green.module.attendance.dto.BatchQuery;
import com.green.module.attendance.dto.CreateBatchDTO;
import com.green.module.attendance.dto.DriverRecordQuery;
import com.green.module.attendance.dto.ReviewBatchDTO;
import com.green.module.attendance.dto.WorkerRecordQuery;
import com.green.module.attendance.vo.*;

import java.util.List;
import java.util.Map;

/**
 * 考勤服务接口
 */
public interface AttendanceService {

    // ==================== 考勤批次 ====================

    IPage<BatchListVO> listBatches(BatchQuery query);

    BatchDetailVO batchDetail(Long id);

    Long createBatchByAdmin(CreateBatchDTO dto);

    void approveBatch(Long id);

    void reviewBatch(ReviewBatchDTO dto);

    // ==================== 工人考勤记录 ====================

    IPage<WorkerAttendanceRecordVO> listWorkerRecords(WorkerRecordQuery query);

    WorkerAttendanceRecordVO workerRecordDetail(Long id);

    Map<String, Object> getWorkerCalendar(Long workerId, Integer year, Integer month);

    // ==================== 司机考勤记录 ====================

    IPage<DriverAttendanceRecordVO> listDriverRecords(DriverRecordQuery query);

    DriverAttendanceRecordVO driverRecordDetail(Long id);

    Map<String, Object> getDriverCalendar(Long driverId, Integer year, Integer month);
}
