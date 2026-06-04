package com.green.module.attendance.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.green.common.enums.BatchStatusEnum;
import com.green.common.exception.BusinessException;
import com.green.common.result.ResultCodeEnum;
import com.green.module.attendance.dto.BatchQuery;
import com.green.module.attendance.dto.CreateBatchDTO;
import com.green.module.attendance.dto.DriverRecordQuery;
import com.green.module.attendance.dto.WorkerRecordQuery;
import com.green.module.attendance.entity.AttendanceBatchEntity;
import com.green.module.attendance.entity.WorkerAttendanceRecordEntity;
import com.green.module.attendance.entity.DriverAttendanceRecordEntity;
import com.green.module.attendance.mapper.AttendanceBatchMapper;
import com.green.module.attendance.mapper.WorkerAttendanceRecordMapper;
import com.green.module.attendance.mapper.DriverAttendanceRecordMapper;
import com.green.module.attendance.mapper.WorkTypeMapper;
import com.green.module.attendance.service.AttendanceService;
import com.green.module.attendance.vo.*;
import com.green.module.driver.entity.DriverEntity;
import com.green.module.driver.mapper.DriverMapper;
import com.green.module.group.entity.GroupEntity;
import com.green.module.group.mapper.GroupMapper;
import com.green.module.project.entity.ProjectEntity;
import com.green.module.project.mapper.ProjectMapper;
import com.green.module.system.entity.AdminEntity;
import com.green.module.system.mapper.AdminMapper;
import com.green.module.worker.entity.WorkerEntity;
import com.green.module.worker.mapper.WorkerMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 考勤服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceBatchMapper batchMapper;
    private final WorkerAttendanceRecordMapper workerRecordMapper;
    private final DriverAttendanceRecordMapper driverRecordMapper;
    private final WorkerMapper workerMapper;
    private final DriverMapper driverMapper;
    private final GroupMapper groupMapper;
    private final ProjectMapper projectMapper;
    private final AdminMapper adminMapper;
    private final WorkTypeMapper workTypeMapper;

    // ==================== 考勤批次 ====================

    @Override
    public IPage<BatchListVO> listBatches(BatchQuery query) {
        Page<AttendanceBatchEntity> page = new Page<>(query.getPageNum(), query.getPageSize());
        LambdaQueryWrapper<AttendanceBatchEntity> wrapper = new LambdaQueryWrapper<>();
        if (query.getStatus() != null) {
            wrapper.eq(AttendanceBatchEntity::getStatus, query.getStatus());
        }
        if (query.getDriverId() != null) {
            wrapper.eq(AttendanceBatchEntity::getDriverId, query.getDriverId());
        }
        if (query.getDateFrom() != null) {
            wrapper.ge(AttendanceBatchEntity::getBatchDate, query.getDateFrom());
        }
        if (query.getDateTo() != null) {
            wrapper.le(AttendanceBatchEntity::getBatchDate, query.getDateTo());
        }
        wrapper.orderByDesc(AttendanceBatchEntity::getSubmitTime);

        IPage<AttendanceBatchEntity> entityPage = batchMapper.selectPage(page, wrapper);

        // 批量查询司机、审核人信息
        Set<Long> driverIds = entityPage.getRecords().stream().map(AttendanceBatchEntity::getDriverId).collect(Collectors.toSet());
        Set<Long> reviewerIds = entityPage.getRecords().stream().map(AttendanceBatchEntity::getReviewerId).filter(Objects::nonNull).collect(Collectors.toSet());
        Map<Long, DriverEntity> driverMap = driverIds.isEmpty() ? Collections.emptyMap()
                : driverMapper.selectBatchIds(driverIds).stream().collect(Collectors.toMap(DriverEntity::getId, d -> d));
        Map<Long, AdminEntity> adminMap = reviewerIds.isEmpty() ? Collections.emptyMap()
                : adminMapper.selectBatchIds(reviewerIds).stream().collect(Collectors.toMap(AdminEntity::getId, a -> a));

        List<BatchListVO> voList = entityPage.getRecords().stream().map(e -> {
            BatchListVO vo = new BatchListVO();
            vo.setId(e.getId());
            vo.setDriverId(e.getDriverId());
            vo.setDriverName(driverMap.getOrDefault(e.getDriverId(), new DriverEntity()).getRealName());
            vo.setBatchDate(e.getBatchDate());
            vo.setStatus(e.getStatus());
            vo.setStatusText(BatchStatusEnum.fromCode(e.getStatus()) != null
                    ? BatchStatusEnum.fromCode(e.getStatus()).getDescription() : "未知");
            vo.setTotalWorkers(e.getTotalWorkers());
            vo.setRemark(e.getRemark());
            vo.setSubmitTime(e.getSubmitTime());
            vo.setReviewTime(e.getReviewTime());
            vo.setReviewerId(e.getReviewerId());
            vo.setReviewerName(adminMap.getOrDefault(e.getReviewerId(), new AdminEntity()).getRealName());
            return vo;
        }).collect(Collectors.toList());

        Page<BatchListVO> result = new Page<>(entityPage.getCurrent(), entityPage.getSize(), entityPage.getTotal());
        result.setRecords(voList);
        return result;
    }

    @Override
    public BatchDetailVO batchDetail(Long id) {
        AttendanceBatchEntity batch = batchMapper.selectById(id);
        if (batch == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "批次不存在");
        }
        BatchDetailVO vo = new BatchDetailVO();
        vo.setId(batch.getId());
        vo.setDriverId(batch.getDriverId());
        DriverEntity driver = driverMapper.selectById(batch.getDriverId());
        vo.setDriverName(driver != null ? driver.getRealName() : "-");
        vo.setBatchDate(batch.getBatchDate());
        vo.setStatus(batch.getStatus());
        vo.setStatusText(BatchStatusEnum.fromCode(batch.getStatus()) != null
                ? BatchStatusEnum.fromCode(batch.getStatus()).getDescription() : "未知");
        vo.setTotalWorkers(batch.getTotalWorkers());
        vo.setRemark(batch.getRemark());
        vo.setSubmitTime(batch.getSubmitTime());
        vo.setReviewTime(batch.getReviewTime());
        vo.setReviewerId(batch.getReviewerId());
        if (batch.getReviewerId() != null) {
            AdminEntity admin = adminMapper.selectById(batch.getReviewerId());
            vo.setReviewerName(admin != null ? admin.getRealName() : "-");
        }

        // 查询批次下的工人考勤记录
        LambdaQueryWrapper<WorkerAttendanceRecordEntity> wWrapper = new LambdaQueryWrapper<>();
        wWrapper.eq(WorkerAttendanceRecordEntity::getBatchId, id);
        List<WorkerAttendanceRecordEntity> records = workerRecordMapper.selectList(wWrapper);
        vo.setWorkerRecords(records.stream().map(this::convertWorkerRecord).collect(Collectors.toList()));
        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createBatchByAdmin(CreateBatchDTO dto) {
        // 校验司机
        DriverEntity driver = driverMapper.selectById(dto.getDriverId());
        if (driver == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "司机不存在");
        }

        // 预检查：筛选出该日期尚无考勤记录的工人
        List<Long> existingWorkerIds = new ArrayList<>();
        List<CreateBatchDTO.WorkerAttendanceItem> validWorkers = new ArrayList<>();
        for (CreateBatchDTO.WorkerAttendanceItem item : dto.getWorkers()) {
            LambdaQueryWrapper<WorkerAttendanceRecordEntity> checkWrapper = new LambdaQueryWrapper<>();
            checkWrapper.eq(WorkerAttendanceRecordEntity::getWorkerId, item.getWorkerId());
            checkWrapper.eq(WorkerAttendanceRecordEntity::getAttendanceDate, dto.getBatchDate());
            if (workerRecordMapper.selectCount(checkWrapper) > 0) {
                existingWorkerIds.add(item.getWorkerId());
                continue;
            }
            validWorkers.add(item);
        }

        if (validWorkers.isEmpty()) {
            throw new BusinessException(ResultCodeEnum.BUSINESS_ERROR,
                    "所选工人在该日期均已存在考勤记录，无法重复创建");
        }

        // 创建批次
        AttendanceBatchEntity batch = new AttendanceBatchEntity();
        batch.setDriverId(dto.getDriverId());
        batch.setBatchDate(dto.getBatchDate());
        batch.setStatus(BatchStatusEnum.PENDING.getCode());
        batch.setSubmitTime(LocalDateTime.now());
        batch.setTotalWorkers(validWorkers.size());
        batch.setRemark(dto.getRemark());
        batchMapper.insert(batch);

        // 创建工人考勤记录
        for (CreateBatchDTO.WorkerAttendanceItem item : validWorkers) {
            WorkerEntity worker = workerMapper.selectById(item.getWorkerId());
            if (worker == null) continue;

            // 计算工资
            BigDecimal dailyWage = calculateDailyWage(worker, dto.getAttendanceType());
            BigDecimal overtimeWage = calculateOvertimeWage(worker, dto.getOvertimeHours());
            BigDecimal totalWage = dailyWage.add(overtimeWage);

            WorkerAttendanceRecordEntity record = new WorkerAttendanceRecordEntity();
            record.setBatchId(batch.getId());
            record.setWorkerId(item.getWorkerId());
            record.setProjectId(item.getProjectId());
            record.setAttendanceDate(dto.getBatchDate());
            record.setAttendanceType(dto.getAttendanceType());
            record.setOvertimeHours(dto.getOvertimeHours() != null ? dto.getOvertimeHours() : BigDecimal.ZERO);
            record.setWorkTypeId(dto.getWorkTypeId());
            record.setDailyWage(dailyWage);
            record.setOvertimeWage(overtimeWage);
            record.setTotalWage(totalWage);
            record.setRemark(item.getRemark());
            record.setIsSettled(0);
            workerRecordMapper.insert(record);
        }

        log.info("管理员创建考勤批次: batchId={}, 工人总数={}, 跳过已有记录工人={}",
                batch.getId(), validWorkers.size(), existingWorkerIds);
        return batch.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void approveBatch(Long id) {
        AttendanceBatchEntity batch = batchMapper.selectById(id);
        if (batch == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "批次不存在");
        }
        if (!BatchStatusEnum.PENDING.getCode().equals(batch.getStatus())) {
            throw new BusinessException(ResultCodeEnum.BATCH_STATUS_ERROR, "当前批次不处于待审核状态");
        }
        batch.setStatus(BatchStatusEnum.APPROVED.getCode());
        batch.setReviewTime(LocalDateTime.now());
        batchMapper.updateById(batch);
        log.info("考勤批次审核通过: batchId={}", id);
    }

    // ==================== 工人考勤记录 ====================

    @Override
    public IPage<WorkerAttendanceRecordVO> listWorkerRecords(WorkerRecordQuery query) {
        Page<WorkerAttendanceRecordEntity> page = new Page<>(query.getPageNum(), query.getPageSize());
        LambdaQueryWrapper<WorkerAttendanceRecordEntity> wrapper = new LambdaQueryWrapper<>();

        if (query.getIsSettled() != null) {
            wrapper.eq(WorkerAttendanceRecordEntity::getIsSettled, query.getIsSettled());
        }
        if (query.getDateFrom() != null) {
            wrapper.ge(WorkerAttendanceRecordEntity::getAttendanceDate, query.getDateFrom());
        }
        if (query.getDateTo() != null) {
            wrapper.le(WorkerAttendanceRecordEntity::getAttendanceDate, query.getDateTo());
        }
        wrapper.orderByDesc(WorkerAttendanceRecordEntity::getAttendanceDate);

        IPage<WorkerAttendanceRecordEntity> entityPage = workerRecordMapper.selectPage(page, wrapper);

        // 若需要按工人属性筛选（姓名、性别、技术工、组别），先查出符合条件的工人ID
        Set<Long> filteredWorkerIds = null;
        if (StringUtils.hasText(query.getWorkerName()) || query.getGender() != null
                || query.getIsSkilledWorker() != null || query.getGroupId() != null) {
            LambdaQueryWrapper<WorkerEntity> wWrapper = new LambdaQueryWrapper<>();
            if (StringUtils.hasText(query.getWorkerName())) {
                wWrapper.like(WorkerEntity::getName, query.getWorkerName());
            }
            if (query.getGender() != null) {
                wWrapper.eq(WorkerEntity::getGender, query.getGender());
            }
            if (query.getIsSkilledWorker() != null) {
                wWrapper.eq(WorkerEntity::getIsSkilledWorker, query.getIsSkilledWorker());
            }
            if (query.getGroupId() != null) {
                wWrapper.eq(WorkerEntity::getGroupId, query.getGroupId());
            }
            filteredWorkerIds = workerMapper.selectList(wWrapper).stream()
                    .map(WorkerEntity::getId).collect(Collectors.toSet());
        }

        // 若需要按审核司机筛选，查出该司机提交的所有批次ID
        Set<Long> filteredBatchIds = null;
        if (query.getDriverId() != null) {
            LambdaQueryWrapper<AttendanceBatchEntity> bWrapper = new LambdaQueryWrapper<>();
            bWrapper.eq(AttendanceBatchEntity::getDriverId, query.getDriverId());
            filteredBatchIds = batchMapper.selectList(bWrapper).stream()
                    .map(AttendanceBatchEntity::getId).collect(Collectors.toSet());
        }

        // 过滤记录
        final Set<Long> workerIdSet = filteredWorkerIds;
        final Set<Long> batchIdSet = filteredBatchIds;
        List<WorkerAttendanceRecordEntity> filteredRecords = entityPage.getRecords().stream().filter(r -> {
            if (workerIdSet != null && !workerIdSet.contains(r.getWorkerId())) return false;
            if (batchIdSet != null && !batchIdSet.contains(r.getBatchId())) return false;
            return true;
        }).collect(Collectors.toList());

        List<WorkerAttendanceRecordVO> voList = filteredRecords.stream()
                .map(this::convertWorkerRecord)
                .collect(Collectors.toList());

        Page<WorkerAttendanceRecordVO> result = new Page<>(entityPage.getCurrent(), entityPage.getSize(), entityPage.getTotal());
        result.setRecords(voList);
        return result;
    }

    @Override
    public WorkerAttendanceRecordVO workerRecordDetail(Long id) {
        WorkerAttendanceRecordEntity record = workerRecordMapper.selectById(id);
        if (record == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "考勤记录不存在");
        }
        return convertWorkerRecord(record);
    }

    @Override
    public Map<String, Object> getWorkerCalendar(Long workerId, Integer year, Integer month) {
        WorkerEntity worker = workerMapper.selectById(workerId);
        if (worker == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "工人不存在");
        }

        YearMonth ym = YearMonth.of(year, month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        LambdaQueryWrapper<WorkerAttendanceRecordEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(WorkerAttendanceRecordEntity::getWorkerId, workerId);
        wrapper.between(WorkerAttendanceRecordEntity::getAttendanceDate, start, end);
        List<WorkerAttendanceRecordEntity> records = workerRecordMapper.selectList(wrapper);

        Map<String, WorkerAttendanceRecordEntity> dateMap = records.stream()
                .collect(Collectors.toMap(r -> r.getAttendanceDate().toString(), r -> r));

        List<CalendarDayVO> days = new ArrayList<>();
        BigDecimal totalWage = BigDecimal.ZERO;
        BigDecimal settledWage = BigDecimal.ZERO;

        for (int d = 1; d <= ym.lengthOfMonth(); d++) {
            LocalDate date = ym.atDay(d);
            String dateStr = date.toString();
            CalendarDayVO day = new CalendarDayVO();
            day.setDate(dateStr);

            WorkerAttendanceRecordEntity rec = dateMap.get(dateStr);
            if (rec != null) {
                day.setRecordId(rec.getId());
                day.setTotalWage(rec.getTotalWage());
                if (rec.getIsSettled() != null && rec.getIsSettled() == 1) {
                    day.setStatus(2); // 已结清
                    settledWage = settledWage.add(rec.getTotalWage());
                } else {
                    day.setStatus(1); // 未结清
                }
                totalWage = totalWage.add(rec.getTotalWage());
            } else {
                day.setStatus(0); // 无记录
            }
            days.add(day);
        }

        CalendarSummaryVO summary = new CalendarSummaryVO();
        summary.setTotalWage(totalWage);
        summary.setSettledWage(settledWage);
        summary.setUnsettledWage(totalWage.subtract(settledWage));

        Map<String, Object> result = new HashMap<>();
        result.put("days", days);
        result.put("summary", summary);
        result.put("workerName", worker.getName());
        return result;
    }

    // ==================== 司机考勤记录 ====================

    @Override
    public IPage<DriverAttendanceRecordVO> listDriverRecords(DriverRecordQuery query) {
        Page<DriverAttendanceRecordEntity> page = new Page<>(query.getPageNum(), query.getPageSize());
        LambdaQueryWrapper<DriverAttendanceRecordEntity> wrapper = new LambdaQueryWrapper<>();

        if (query.getIsSettled() != null) {
            wrapper.eq(DriverAttendanceRecordEntity::getIsSettled, query.getIsSettled());
        }
        if (query.getDateFrom() != null) {
            wrapper.ge(DriverAttendanceRecordEntity::getAttendanceDate, query.getDateFrom());
        }
        if (query.getDateTo() != null) {
            wrapper.le(DriverAttendanceRecordEntity::getAttendanceDate, query.getDateTo());
        }
        wrapper.orderByDesc(DriverAttendanceRecordEntity::getAttendanceDate);

        IPage<DriverAttendanceRecordEntity> entityPage = driverRecordMapper.selectPage(page, wrapper);

        // 若需要按司机姓名筛选
        Set<Long> filteredDriverIds = null;
        if (StringUtils.hasText(query.getDriverName())) {
            LambdaQueryWrapper<DriverEntity> dWrapper = new LambdaQueryWrapper<>();
            dWrapper.like(DriverEntity::getRealName, query.getDriverName());
            filteredDriverIds = driverMapper.selectList(dWrapper).stream()
                    .map(DriverEntity::getId).collect(Collectors.toSet());
        }

        final Set<Long> finalFilteredDriverIds = filteredDriverIds;
        List<DriverAttendanceRecordEntity> filteredRecords = entityPage.getRecords().stream()
                .filter(r -> finalFilteredDriverIds == null || finalFilteredDriverIds.contains(r.getDriverId()))
                .collect(Collectors.toList());

        List<DriverAttendanceRecordVO> voList = filteredRecords.stream()
                .map(this::convertDriverRecord)
                .collect(Collectors.toList());

        Page<DriverAttendanceRecordVO> result = new Page<>(entityPage.getCurrent(), entityPage.getSize(), entityPage.getTotal());
        result.setRecords(voList);
        return result;
    }

    @Override
    public DriverAttendanceRecordVO driverRecordDetail(Long id) {
        DriverAttendanceRecordEntity record = driverRecordMapper.selectById(id);
        if (record == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "考勤记录不存在");
        }
        return convertDriverRecord(record);
    }

    @Override
    public Map<String, Object> getDriverCalendar(Long driverId, Integer year, Integer month) {
        DriverEntity driver = driverMapper.selectById(driverId);
        if (driver == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "司机不存在");
        }

        YearMonth ym = YearMonth.of(year, month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        LambdaQueryWrapper<DriverAttendanceRecordEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DriverAttendanceRecordEntity::getDriverId, driverId);
        wrapper.between(DriverAttendanceRecordEntity::getAttendanceDate, start, end);
        List<DriverAttendanceRecordEntity> records = driverRecordMapper.selectList(wrapper);

        Map<String, DriverAttendanceRecordEntity> dateMap = records.stream()
                .collect(Collectors.toMap(r -> r.getAttendanceDate().toString(), r -> r));

        List<CalendarDayVO> days = new ArrayList<>();
        BigDecimal totalWage = BigDecimal.ZERO;
        BigDecimal settledWage = BigDecimal.ZERO;

        for (int d = 1; d <= ym.lengthOfMonth(); d++) {
            LocalDate date = ym.atDay(d);
            String dateStr = date.toString();
            CalendarDayVO day = new CalendarDayVO();
            day.setDate(dateStr);

            DriverAttendanceRecordEntity rec = dateMap.get(dateStr);
            if (rec != null) {
                day.setRecordId(rec.getId());
                day.setTotalWage(rec.getTotalWage());
                if (rec.getIsSettled() != null && rec.getIsSettled() == 1) {
                    day.setStatus(2);
                    settledWage = settledWage.add(rec.getTotalWage());
                } else {
                    day.setStatus(1);
                }
                totalWage = totalWage.add(rec.getTotalWage());
            } else {
                day.setStatus(0);
            }
            days.add(day);
        }

        CalendarSummaryVO summary = new CalendarSummaryVO();
        summary.setTotalWage(totalWage);
        summary.setSettledWage(settledWage);
        summary.setUnsettledWage(totalWage.subtract(settledWage));

        Map<String, Object> result = new HashMap<>();
        result.put("days", days);
        result.put("summary", summary);
        result.put("driverName", driver.getRealName());
        return result;
    }

    // ==================== 私有辅助方法 ====================

    private WorkerAttendanceRecordVO convertWorkerRecord(WorkerAttendanceRecordEntity rec) {
        WorkerAttendanceRecordVO vo = new WorkerAttendanceRecordVO();
        vo.setId(rec.getId());
        vo.setBatchId(rec.getBatchId());
        vo.setWorkerId(rec.getWorkerId());
        vo.setProjectId(rec.getProjectId());
        vo.setWorkTypeId(rec.getWorkTypeId());
        vo.setAttendanceDate(rec.getAttendanceDate());
        vo.setAttendanceType(rec.getAttendanceType());
        vo.setAttendanceTypeText(rec.getAttendanceType() != null && rec.getAttendanceType() == 1 ? "半天" : "全天");
        vo.setOvertimeHours(rec.getOvertimeHours());
        vo.setDailyWage(rec.getDailyWage());
        vo.setOvertimeWage(rec.getOvertimeWage());
        vo.setTotalWage(rec.getTotalWage());
        vo.setRemark(rec.getRemark());
        vo.setIsSettled(rec.getIsSettled());
        vo.setIsSettledText(rec.getIsSettled() != null && rec.getIsSettled() == 1 ? "已结清" : "未结清");
        vo.setSettledTime(rec.getSettledTime());

        WorkerEntity worker = workerMapper.selectById(rec.getWorkerId());
        if (worker != null) {
            vo.setWorkerName(worker.getName());
            vo.setGenderText(worker.getGender() != null && worker.getGender() == 1 ? "男" : "女");
            vo.setIsSkilledWorkerText(worker.getIsSkilledWorker() != null && worker.getIsSkilledWorker() == 1 ? "是" : "否");
            if (worker.getGroupId() != null) {
                GroupEntity group = groupMapper.selectById(worker.getGroupId());
                vo.setGroupName(group != null ? group.getGroupName() : "-");
            }
        }

        if (rec.getProjectId() != null) {
            ProjectEntity project = projectMapper.selectById(rec.getProjectId());
            vo.setProjectName(project != null ? project.getProjectName() : "-");
        }

        // 查询作业类型名称
        if (rec.getWorkTypeId() != null) {
            com.green.module.attendance.entity.WorkTypeEntity wt = workTypeMapper.selectById(rec.getWorkTypeId());
            vo.setWorkTypeName(wt != null ? wt.getTypeName() : "-");
        }

        // 查询批次对应的司机
        if (rec.getBatchId() != null) {
            AttendanceBatchEntity batch = batchMapper.selectById(rec.getBatchId());
            if (batch != null) {
                vo.setDriverId(batch.getDriverId());
                DriverEntity driver = driverMapper.selectById(batch.getDriverId());
                vo.setDriverName(driver != null ? driver.getRealName() : "-");
            }
        }
        return vo;
    }

    private DriverAttendanceRecordVO convertDriverRecord(DriverAttendanceRecordEntity rec) {
        DriverAttendanceRecordVO vo = new DriverAttendanceRecordVO();
        vo.setId(rec.getId());
        vo.setDriverId(rec.getDriverId());
        vo.setWorkTypeId(rec.getWorkTypeId());
        vo.setAttendanceDate(rec.getAttendanceDate());
        vo.setAttendanceType(rec.getAttendanceType());
        vo.setAttendanceTypeText("全天");
        vo.setOvertimeHours(rec.getOvertimeHours());
        vo.setDailyWage(rec.getDailyWage());
        vo.setOvertimeWage(rec.getOvertimeWage());
        vo.setTotalWage(rec.getTotalWage());
        vo.setRemark(rec.getRemark());
        vo.setIsSettled(rec.getIsSettled());
        vo.setIsSettledText(rec.getIsSettled() != null && rec.getIsSettled() == 1 ? "已结清" : "未结清");
        vo.setSettledTime(rec.getSettledTime());

        DriverEntity driver = driverMapper.selectById(rec.getDriverId());
        if (driver != null) {
            vo.setDriverName(driver.getRealName());
        }

        // 查询作业类型名称
        if (rec.getWorkTypeId() != null) {
            com.green.module.attendance.entity.WorkTypeEntity wt = workTypeMapper.selectById(rec.getWorkTypeId());
            vo.setWorkTypeName(wt != null ? wt.getTypeName() : "-");
        }
        return vo;
    }

    /**
     * 计算当日基础工资
     */
    private BigDecimal calculateDailyWage(WorkerEntity worker, Integer attendanceType) {
        BigDecimal base = worker.getBaseDailySalary() != null ? worker.getBaseDailySalary() : BigDecimal.ZERO;
        if (attendanceType != null && attendanceType == 1) {
            base = base.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        }
        return base;
    }

    /**
     * 计算当日加班工资
     */
    private BigDecimal calculateOvertimeWage(WorkerEntity worker, BigDecimal overtimeHours) {
        if (overtimeHours == null || overtimeHours.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal rate = worker.getOvertimeHourlyRate() != null ? worker.getOvertimeHourlyRate() : BigDecimal.ZERO;
        return rate.multiply(overtimeHours).setScale(2, RoundingMode.HALF_UP);
    }
}
