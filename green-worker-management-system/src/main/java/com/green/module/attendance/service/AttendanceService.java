package com.green.module.attendance.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.green.module.attendance.dto.BatchQuery;
import com.green.module.attendance.dto.CreateBatchDTO;
import com.green.module.attendance.dto.DriverRecordQuery;
import com.green.module.attendance.dto.ReviewBatchDTO;
import com.green.module.attendance.dto.UpdateDriverRecordDTO;
import com.green.module.attendance.dto.UpdateWorkerRecordDTO;
import com.green.module.attendance.dto.WorkerRecordQuery;
import com.green.module.attendance.vo.*;

import java.time.LocalDate;
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

    void updateBatch(Long id, CreateBatchDTO dto);

    void approveBatch(Long id);

    void reviewBatch(ReviewBatchDTO dto);

    void rejectBatch(Long id);

    void deleteBatch(Long id);

    // ==================== 工人考勤记录 ====================

    IPage<WorkerAttendanceRecordVO> listWorkerRecords(WorkerRecordQuery query);

    WorkerAttendanceRecordVO workerRecordDetail(Long id);

    void updateWorkerRecord(Long id, UpdateWorkerRecordDTO dto);

    void deleteWorkerRecord(Long id);

    Map<String, Object> getWorkerCalendar(Long workerId, Integer year, Integer month);

    // ==================== 司机考勤记录 ====================

    IPage<DriverAttendanceRecordVO> listDriverRecords(DriverRecordQuery query);

    DriverAttendanceRecordVO driverRecordDetail(Long id);

    void updateDriverRecord(Long id, UpdateDriverRecordDTO dto);

    void deleteDriverRecord(Long id);

    Map<String, Object> getDriverCalendar(Long driverId, Integer year, Integer month);

    WageSummaryVO getWorkerWageSummary(Long workerId);

    WageSummaryVO getDriverWageSummary(Long driverId);

    SettlePreviewVO previewWorkerSettle(Long workerId, LocalDate dateFrom, LocalDate dateTo);

    void settleWorkerRecords(Long workerId, LocalDate dateFrom, LocalDate dateTo);

    SettlePreviewVO previewDriverSettle(Long driverId, LocalDate dateFrom, LocalDate dateTo);

    void settleDriverRecords(Long driverId, LocalDate dateFrom, LocalDate dateTo);

    // ==================== 月度考勤报表 ====================

    List<MonthOptionVO> listAttendanceMonths();

    List<GroupOptionVO> listWorkerGroupsWithRecords(Integer year, Integer month);

    MonthlyReportVO getWorkerMonthlyReport(Integer year, Integer month, Long groupId);

    MonthlyReportVO getDriverMonthlyReport(Integer year, Integer month);
}
