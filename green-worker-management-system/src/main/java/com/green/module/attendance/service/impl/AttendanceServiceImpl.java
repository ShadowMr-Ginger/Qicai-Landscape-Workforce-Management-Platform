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
import com.green.module.attendance.dto.ReviewBatchDTO;
import com.green.module.attendance.dto.UpdateDriverRecordDTO;
import com.green.module.attendance.dto.UpdateWorkerRecordDTO;
import com.green.module.attendance.dto.WorkerRecordQuery;
import com.green.module.attendance.entity.AttendanceBatchEntity;
import com.green.module.attendance.entity.AttendanceBatchWorkerItemEntity;
import com.green.module.attendance.entity.AttendanceBatchDriverItemEntity;
import com.green.module.attendance.entity.WorkerAttendanceRecordEntity;
import com.green.module.attendance.entity.DriverAttendanceRecordEntity;
import com.green.module.attendance.mapper.AttendanceBatchMapper;
import com.green.module.attendance.mapper.AttendanceBatchWorkerItemMapper;
import com.green.module.attendance.mapper.AttendanceBatchDriverItemMapper;
import com.green.module.attendance.mapper.WorkerAttendanceRecordMapper;
import com.green.module.attendance.mapper.DriverAttendanceRecordMapper;
import com.green.module.attendance.mapper.WorkTypeMapper;
import com.green.module.attendance.service.AttendanceService;
import com.green.module.anomaly.service.AnomalyRecordService;
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
import com.green.utils.SecurityUtils;
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
    private final AttendanceBatchWorkerItemMapper workerItemMapper;
    private final AttendanceBatchDriverItemMapper driverItemMapper;
    private final WorkerMapper workerMapper;
    private final DriverMapper driverMapper;
    private final GroupMapper groupMapper;
    private final ProjectMapper projectMapper;
    private final AdminMapper adminMapper;
    private final WorkTypeMapper workTypeMapper;
    private final com.green.module.system.service.SystemConfigService systemConfigService;
    private final AnomalyRecordService anomalyRecordService;

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

        // 查询批次下的工人考勤明细（来自临时明细表）
        LambdaQueryWrapper<AttendanceBatchWorkerItemEntity> wWrapper = new LambdaQueryWrapper<>();
        wWrapper.eq(AttendanceBatchWorkerItemEntity::getBatchId, id);
        List<AttendanceBatchWorkerItemEntity> items = workerItemMapper.selectList(wWrapper);
        vo.setWorkerRecords(items.stream().map(item -> convertWorkerItem(item, batch, driver))
                .collect(Collectors.toList()));

        // 查询批次下的司机考勤明细（来自临时明细表）
        LambdaQueryWrapper<AttendanceBatchDriverItemEntity> dWrapper = new LambdaQueryWrapper<>();
        dWrapper.eq(AttendanceBatchDriverItemEntity::getBatchId, id);
        AttendanceBatchDriverItemEntity driverItem = driverItemMapper.selectOne(dWrapper);
        DriverAttendanceRecordEntity driverRecord;
        if (driverItem != null) {
            driverRecord = new DriverAttendanceRecordEntity();
            driverRecord.setId(driverItem.getId());
            driverRecord.setDriverId(driverItem.getDriverId());
            driverRecord.setAttendanceDate(driverItem.getAttendanceDate());
            driverRecord.setAttendanceType(driverItem.getAttendanceType());
            driverRecord.setOvertimeHours(driverItem.getOvertimeHours());
            driverRecord.setDailyWage(driverItem.getDailyWage());
            driverRecord.setOvertimeWage(driverItem.getOvertimeWage());
            driverRecord.setTotalWage(driverItem.getTotalWage());
            driverRecord.setRemark(driverItem.getRemark());
            driverRecord.setIsSettled(0);
            driverRecord.setSourceBatchId(batch.getId());
        } else {
            // 如果还没生成司机明细，构造一条默认的返回给前端展示
            driverRecord = buildDefaultDriverRecord(batch, driver);
        }
        vo.setDriverRecord(convertDriverRecord(driverRecord));
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

        // 创建批次
        AttendanceBatchEntity batch = new AttendanceBatchEntity();
        batch.setDriverId(dto.getDriverId());
        batch.setBatchDate(dto.getBatchDate());
        batch.setStatus(BatchStatusEnum.PENDING.getCode());
        batch.setSubmitTime(LocalDateTime.now());
        batch.setTotalWorkers(dto.getWorkers().size());
        batch.setRemark(dto.getRemark());
        batchMapper.insert(batch);

        // 创建工人考勤明细（保存到临时明细表，审核通过后再写入总表）
        for (CreateBatchDTO.WorkerAttendanceItem item : dto.getWorkers()) {
            WorkerEntity worker = workerMapper.selectById(item.getWorkerId());
            if (worker == null) continue;

            // 计算工资
            BigDecimal dailyWage = calculateDailyWage(worker, dto.getAttendanceType());
            BigDecimal overtimeWage = calculateOvertimeWage(worker, dto.getOvertimeHours());
            BigDecimal totalWage = dailyWage.add(overtimeWage);

            AttendanceBatchWorkerItemEntity record = new AttendanceBatchWorkerItemEntity();
            record.setBatchId(batch.getId());
            record.setWorkerId(item.getWorkerId());
            record.setProjectId(item.getProjectId());
            record.setAttendanceType(dto.getAttendanceType());
            record.setOvertimeHours(dto.getOvertimeHours() != null ? dto.getOvertimeHours() : BigDecimal.ZERO);
            record.setWorkTypeId(dto.getWorkTypeId());
            record.setDailyWage(dailyWage);
            record.setOvertimeWage(overtimeWage);
            record.setTotalWage(totalWage);
            record.setRemark(item.getRemark());
            workerItemMapper.insert(record);
        }

        // 创建司机考勤明细（保存到临时明细表）
        createDriverItemForBatch(batch, driver, dto.getOvertimeHours(), dto.getRemark());

        log.info("管理员创建考勤批次: batchId={}, 工人总数={}", batch.getId(), dto.getWorkers().size());
        return batch.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateBatch(Long id, CreateBatchDTO dto) {
        AttendanceBatchEntity batch = batchMapper.selectById(id);
        if (batch == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "批次不存在");
        }
        if (!BatchStatusEnum.WITHDRAWN.getCode().equals(batch.getStatus())) {
            throw new BusinessException(ResultCodeEnum.BATCH_STATUS_ERROR, "只有已撤回的批次可以编辑重新提交");
        }

        // 更新批次信息
        batch.setBatchDate(dto.getBatchDate());
        batch.setStatus(BatchStatusEnum.PENDING.getCode());
        batch.setSubmitTime(LocalDateTime.now());
        batch.setTotalWorkers(dto.getWorkers().size());
        batch.setRemark(dto.getRemark());
        batchMapper.updateById(batch);

        // 删除旧的工人明细
        LambdaQueryWrapper<AttendanceBatchWorkerItemEntity> deleteWrapper = new LambdaQueryWrapper<>();
        deleteWrapper.eq(AttendanceBatchWorkerItemEntity::getBatchId, id);
        workerItemMapper.delete(deleteWrapper);

        // 删除旧的司机明细
        LambdaQueryWrapper<AttendanceBatchDriverItemEntity> driverDeleteWrapper = new LambdaQueryWrapper<>();
        driverDeleteWrapper.eq(AttendanceBatchDriverItemEntity::getBatchId, id);
        driverItemMapper.delete(driverDeleteWrapper);

        // 重新创建工人考勤明细
        for (CreateBatchDTO.WorkerAttendanceItem item : dto.getWorkers()) {
            WorkerEntity worker = workerMapper.selectById(item.getWorkerId());
            if (worker == null) continue;

            BigDecimal dailyWage = calculateDailyWage(worker, dto.getAttendanceType());
            BigDecimal overtimeWage = calculateOvertimeWage(worker, dto.getOvertimeHours());
            BigDecimal totalWage = dailyWage.add(overtimeWage);

            AttendanceBatchWorkerItemEntity record = new AttendanceBatchWorkerItemEntity();
            record.setBatchId(batch.getId());
            record.setWorkerId(item.getWorkerId());
            record.setProjectId(item.getProjectId());
            record.setAttendanceType(dto.getAttendanceType());
            record.setOvertimeHours(dto.getOvertimeHours() != null ? dto.getOvertimeHours() : BigDecimal.ZERO);
            record.setWorkTypeId(dto.getWorkTypeId());
            record.setDailyWage(dailyWage);
            record.setOvertimeWage(overtimeWage);
            record.setTotalWage(totalWage);
            record.setRemark(item.getRemark());
            workerItemMapper.insert(record);
        }

        // 重新创建司机考勤明细
        DriverEntity driver = driverMapper.selectById(batch.getDriverId());
        if (driver != null) {
            createDriverItemForBatch(batch, driver, dto.getOvertimeHours(), dto.getRemark());
        }

        log.info("更新考勤批次: batchId={}, 工人总数={}", batch.getId(), dto.getWorkers().size());
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
        batch.setReviewerId(SecurityUtils.getCurrentUserId());
        batchMapper.updateById(batch);

        // 审核通过后，将工人明细写入正式考勤记录表
        insertWorkerRecordsFromItems(batch);

        // 将司机明细写入正式司机考勤记录表
        insertDriverRecordFromItem(batch);

        // 异常检测
        anomalyRecordService.checkAttendanceDuplicateAfterBatchReview(id);
        anomalyRecordService.checkOvertimeAfterBatchReview(id);

        log.info("考勤批次审核通过: batchId={}", id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void reviewBatch(ReviewBatchDTO dto) {
        Long batchId = dto.getBatchId();
        AttendanceBatchEntity batch = batchMapper.selectById(batchId);
        if (batch == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "批次不存在");
        }
        if (!BatchStatusEnum.PENDING.getCode().equals(batch.getStatus())) {
            throw new BusinessException(ResultCodeEnum.BATCH_STATUS_ERROR, "当前批次不处于待审核状态");
        }

        // 批量更新工人考勤明细（临时表）
        if (dto.getWorkerRecords() != null && !dto.getWorkerRecords().isEmpty()) {
            for (ReviewBatchDTO.WorkerRecordUpdateItem item : dto.getWorkerRecords()) {
                AttendanceBatchWorkerItemEntity record = workerItemMapper.selectById(item.getRecordId());
                if (record == null || !record.getBatchId().equals(batchId)) {
                    continue;
                }

                WorkerEntity worker = workerMapper.selectById(record.getWorkerId());
                if (worker == null) continue;

                // 更新可修改字段
                if (item.getWorkTypeId() != null) {
                    record.setWorkTypeId(item.getWorkTypeId());
                }
                if (item.getProjectId() != null) {
                    record.setProjectId(item.getProjectId());
                }
                if (item.getAttendanceType() != null) {
                    record.setAttendanceType(item.getAttendanceType());
                }
                if (item.getOvertimeHours() != null) {
                    record.setOvertimeHours(item.getOvertimeHours());
                }
                if (item.getRemark() != null) {
                    record.setRemark(item.getRemark());
                }

                // 工资处理：前端传入则优先使用，否则重新计算
                if (item.getDailyWage() != null) {
                    record.setDailyWage(item.getDailyWage());
                }
                if (item.getOvertimeWage() != null) {
                    record.setOvertimeWage(item.getOvertimeWage());
                }
                if (item.getTotalWage() != null) {
                    record.setTotalWage(item.getTotalWage());
                } else {
                    // 如果没有传 totalWage，自动计算
                    BigDecimal dailyWage = record.getDailyWage() != null ? record.getDailyWage()
                            : calculateDailyWage(worker, record.getAttendanceType());
                    BigDecimal overtimeWage = record.getOvertimeWage() != null ? record.getOvertimeWage()
                            : calculateOvertimeWage(worker, record.getOvertimeHours());
                    record.setDailyWage(dailyWage);
                    record.setOvertimeWage(overtimeWage);
                    record.setTotalWage(dailyWage.add(overtimeWage));
                }

                workerItemMapper.updateById(record);
            }
        }

        // 更新司机考勤明细（临时表）
        if (dto.getDriverRecord() != null) {
            ReviewBatchDTO.DriverRecordUpdateItem driverItem = dto.getDriverRecord();
            AttendanceBatchDriverItemEntity driverRec = driverItemMapper.selectById(driverItem.getRecordId());
            if (driverRec != null && batchId.equals(driverRec.getBatchId())) {
                if (driverItem.getOvertimeHours() != null) {
                    driverRec.setOvertimeHours(driverItem.getOvertimeHours());
                }
                if (driverItem.getRemark() != null) {
                    driverRec.setRemark(driverItem.getRemark());
                }
                if (driverItem.getDailyWage() != null) {
                    driverRec.setDailyWage(driverItem.getDailyWage());
                }
                // 重新计算司机加班工资和总工资
                DriverEntity driver = driverMapper.selectById(driverRec.getDriverId());
                if (driver != null) {
                    BigDecimal dailyWage = driverRec.getDailyWage() != null ? driverRec.getDailyWage()
                            : (driver.getBaseDailySalary() != null ? driver.getBaseDailySalary() : BigDecimal.ZERO);
                    BigDecimal overtimeWage = calculateDriverOvertimeWage(driver, driverRec.getOvertimeHours());
                    driverRec.setDailyWage(dailyWage);
                    driverRec.setOvertimeWage(overtimeWage);
                    driverRec.setTotalWage(dailyWage.add(overtimeWage));
                }
                driverItemMapper.updateById(driverRec);
            }
        }

        // 审核通过
        batch.setStatus(BatchStatusEnum.APPROVED.getCode());
        batch.setReviewTime(LocalDateTime.now());
        batch.setReviewerId(SecurityUtils.getCurrentUserId());
        batchMapper.updateById(batch);

        // 将明细写入正式考勤记录表
        insertWorkerRecordsFromItems(batch);
        insertDriverRecordFromItem(batch);

        // 异常检测
        anomalyRecordService.checkAttendanceDuplicateAfterBatchReview(batchId);
        anomalyRecordService.checkOvertimeAfterBatchReview(batchId);

        log.info("考勤批次审核通过(含修改): batchId={}", batchId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void rejectBatch(Long id) {
        AttendanceBatchEntity batch = batchMapper.selectById(id);
        if (batch == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "批次不存在");
        }
        if (!BatchStatusEnum.PENDING.getCode().equals(batch.getStatus())) {
            throw new BusinessException(ResultCodeEnum.BATCH_STATUS_ERROR, "当前批次不处于待审核状态");
        }
        batch.setStatus(BatchStatusEnum.REJECTED.getCode());
        batch.setReviewTime(LocalDateTime.now());
        batch.setReviewerId(SecurityUtils.getCurrentUserId());
        batchMapper.updateById(batch);
        log.info("考勤批次审核不通过: batchId={}", id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteBatch(Long id) {
        AttendanceBatchEntity batch = batchMapper.selectById(id);
        if (batch == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "批次不存在");
        }
        // 删除关联的工人/司机明细临时记录
        LambdaQueryWrapper<AttendanceBatchWorkerItemEntity> workerItemDelete = new LambdaQueryWrapper<>();
        workerItemDelete.eq(AttendanceBatchWorkerItemEntity::getBatchId, id);
        workerItemMapper.delete(workerItemDelete);

        LambdaQueryWrapper<AttendanceBatchDriverItemEntity> driverItemDelete = new LambdaQueryWrapper<>();
        driverItemDelete.eq(AttendanceBatchDriverItemEntity::getBatchId, id);
        driverItemMapper.delete(driverItemDelete);

        batchMapper.deleteById(id);
        log.info("考勤批次删除成功: batchId={}", id);
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
        if (query.getDriverId() != null) {
            wrapper.eq(WorkerAttendanceRecordEntity::getDriverId, query.getDriverId());
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

        // 过滤记录
        final Set<Long> workerIdSet = filteredWorkerIds;
        List<WorkerAttendanceRecordEntity> filteredRecords = entityPage.getRecords().stream().filter(r -> {
            if (workerIdSet != null && !workerIdSet.contains(r.getWorkerId())) return false;
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
    @Transactional(rollbackFor = Exception.class)
    public void updateWorkerRecord(Long id, UpdateWorkerRecordDTO dto) {
        WorkerAttendanceRecordEntity record = workerRecordMapper.selectById(id);
        if (record == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "考勤记录不存在");
        }

        record.setWorkerId(dto.getWorkerId());
        record.setAttendanceDate(dto.getAttendanceDate());
        record.setAttendanceType(dto.getAttendanceType());
        record.setOvertimeHours(dto.getOvertimeHours());
        record.setDailyWage(dto.getDailyWage());
        record.setOvertimeWage(dto.getOvertimeWage() != null ? dto.getOvertimeWage() : BigDecimal.ZERO);
        record.setTotalWage(dto.getDailyWage().add(record.getOvertimeWage()));
        record.setProjectId(dto.getProjectId());
        record.setWorkTypeId(dto.getWorkTypeId());
        record.setRemark(dto.getRemark());

        // 结清状态变更处理
        Integer oldSettled = record.getIsSettled();
        Integer newSettled = dto.getIsSettled();
        if (newSettled != null) {
            record.setIsSettled(newSettled);
            if (oldSettled == null || oldSettled == 0) {
                if (newSettled == 1) {
                    record.setSettledTime(LocalDateTime.now());
                    record.setSettledBy(SecurityUtils.getCurrentUserId());
                }
            } else if (oldSettled == 1 && newSettled == 0) {
                record.setSettledTime(null);
                record.setSettledBy(null);
            }
        }

        // 直接更新记录的审核司机（不再通过批次间接修改）
        if (dto.getDriverId() != null) {
            record.setDriverId(dto.getDriverId());
        }

        workerRecordMapper.updateById(record);
        log.info("工人考勤记录更新成功: recordId={}", id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteWorkerRecord(Long id) {
        WorkerAttendanceRecordEntity record = workerRecordMapper.selectById(id);
        if (record == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "考勤记录不存在");
        }
        workerRecordMapper.deleteById(id);
        log.info("工人考勤记录删除成功: recordId={}", id);
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
                .collect(Collectors.toMap(r -> r.getAttendanceDate().toString(), r -> r,
                        (existing, replacement) -> existing)); // 同一天多条记录取第一条

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
    @Transactional(rollbackFor = Exception.class)
    public void updateDriverRecord(Long id, UpdateDriverRecordDTO dto) {
        DriverAttendanceRecordEntity record = driverRecordMapper.selectById(id);
        if (record == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "考勤记录不存在");
        }

        record.setDriverId(dto.getDriverId());
        record.setAttendanceDate(dto.getAttendanceDate());
        record.setAttendanceType(dto.getAttendanceType());
        record.setOvertimeHours(dto.getOvertimeHours());
        record.setDailyWage(dto.getDailyWage());
        record.setOvertimeWage(dto.getOvertimeWage() != null ? dto.getOvertimeWage() : BigDecimal.ZERO);
        record.setTotalWage(dto.getDailyWage().add(record.getOvertimeWage()));
        record.setWorkTypeId(dto.getWorkTypeId());
        record.setRemark(dto.getRemark());

        // 结清状态变更处理
        Integer oldSettled = record.getIsSettled();
        Integer newSettled = dto.getIsSettled();
        if (newSettled != null) {
            record.setIsSettled(newSettled);
            if (oldSettled == null || oldSettled == 0) {
                if (newSettled == 1) {
                    record.setSettledTime(LocalDateTime.now());
                    record.setSettledBy(SecurityUtils.getCurrentUserId());
                }
            } else if (oldSettled == 1 && newSettled == 0) {
                record.setSettledTime(null);
                record.setSettledBy(null);
            }
        }

        driverRecordMapper.updateById(record);
        log.info("司机考勤记录更新成功: recordId={}", id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteDriverRecord(Long id) {
        DriverAttendanceRecordEntity record = driverRecordMapper.selectById(id);
        if (record == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "考勤记录不存在");
        }
        driverRecordMapper.deleteById(id);
        log.info("司机考勤记录删除成功: recordId={}", id);
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
                .collect(Collectors.toMap(r -> r.getAttendanceDate().toString(), r -> r,
                        (existing, replacement) -> existing)); // 同一天多条记录取第一条

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
            vo.setBaseDailySalary(worker.getBaseDailySalary());
            vo.setOvertimeHourlyRate(worker.getOvertimeHourlyRate());
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

        // 直接从记录读取审核司机（已与批次解耦）
        vo.setDriverId(rec.getDriverId());
        if (rec.getDriverId() != null) {
            DriverEntity driver = driverMapper.selectById(rec.getDriverId());
            vo.setDriverName(driver != null ? driver.getRealName() : "-");
        }
        return vo;
    }

    /**
     * 将批次工人明细临时实体转换为展示 VO
     */
    private WorkerAttendanceRecordVO convertWorkerItem(AttendanceBatchWorkerItemEntity item,
                                                        AttendanceBatchEntity batch,
                                                        DriverEntity driver) {
        WorkerAttendanceRecordEntity rec = new WorkerAttendanceRecordEntity();
        rec.setId(item.getId());
        rec.setBatchId(batch.getId());
        rec.setDriverId(batch.getDriverId());
        rec.setWorkerId(item.getWorkerId());
        rec.setProjectId(item.getProjectId());
        rec.setAttendanceDate(batch.getBatchDate());
        rec.setAttendanceType(item.getAttendanceType());
        rec.setOvertimeHours(item.getOvertimeHours());
        rec.setWorkTypeId(item.getWorkTypeId());
        rec.setDailyWage(item.getDailyWage());
        rec.setOvertimeWage(item.getOvertimeWage());
        rec.setTotalWage(item.getTotalWage());
        rec.setRemark(item.getRemark());
        rec.setIsSettled(0);
        return convertWorkerRecord(rec);
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
            vo.setBaseDailySalary(driver.getBaseDailySalary());
            vo.setOvertimeHourlyRate(driver.getOvertimeHourlyRate());
        }

        // 查询作业类型名称
        if (rec.getWorkTypeId() != null) {
            com.green.module.attendance.entity.WorkTypeEntity wt = workTypeMapper.selectById(rec.getWorkTypeId());
            vo.setWorkTypeName(wt != null ? wt.getTypeName() : "-");
        }
        return vo;
    }

    @Override
    public WageSummaryVO getWorkerWageSummary(Long workerId) {
        String startWorkDateStr = systemConfigService.getValue("start_work_date");
        LocalDate startWorkDate = startWorkDateStr != null ? LocalDate.parse(startWorkDateStr) : LocalDate.of(LocalDate.now().getYear(), 1, 1);

        LambdaQueryWrapper<WorkerAttendanceRecordEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(WorkerAttendanceRecordEntity::getWorkerId, workerId);
        List<WorkerAttendanceRecordEntity> records = workerRecordMapper.selectList(wrapper);

        return calculateWageSummary(records, startWorkDate,
                r -> r.getAttendanceDate(), r -> r.getTotalWage(), r -> r.getIsSettled(),
                r -> r.getAttendanceType(), r -> r.getOvertimeHours());
    }

    @Override
    public WageSummaryVO getDriverWageSummary(Long driverId) {
        String startWorkDateStr = systemConfigService.getValue("start_work_date");
        LocalDate startWorkDate = startWorkDateStr != null ? LocalDate.parse(startWorkDateStr) : LocalDate.of(LocalDate.now().getYear(), 1, 1);

        LambdaQueryWrapper<DriverAttendanceRecordEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DriverAttendanceRecordEntity::getDriverId, driverId);
        List<DriverAttendanceRecordEntity> records = driverRecordMapper.selectList(wrapper);

        return calculateWageSummary(records, startWorkDate,
                r -> r.getAttendanceDate(), r -> r.getTotalWage(), r -> r.getIsSettled(),
                r -> r.getAttendanceType(), r -> r.getOvertimeHours());
    }

    private <T> WageSummaryVO calculateWageSummary(List<T> records, LocalDate startWorkDate,
                                                     java.util.function.Function<T, LocalDate> dateExtractor,
                                                     java.util.function.Function<T, BigDecimal> wageExtractor,
                                                     java.util.function.Function<T, Integer> settledExtractor,
                                                     java.util.function.Function<T, Integer> attendanceTypeExtractor,
                                                     java.util.function.Function<T, BigDecimal> overtimeHoursExtractor) {
        WageSummaryVO vo = new WageSummaryVO();
        vo.setTotalUnsettled(BigDecimal.ZERO);
        vo.setYearTotal(BigDecimal.ZERO);
        vo.setYearSettled(BigDecimal.ZERO);
        vo.setYearUnsettled(BigDecimal.ZERO);
        vo.setHistoricalUnsettled(BigDecimal.ZERO);
        vo.setYearAttendanceDays(BigDecimal.ZERO);
        vo.setYearOvertimeHours(BigDecimal.ZERO);
        vo.setMonthAttendanceDays(BigDecimal.ZERO);
        vo.setMonthOvertimeHours(BigDecimal.ZERO);

        LocalDate today = LocalDate.now();
        YearMonth currentMonth = YearMonth.now();

        for (T rec : records) {
            LocalDate date = dateExtractor.apply(rec);
            if (date == null) continue;

            BigDecimal wage = wageExtractor.apply(rec) != null ? wageExtractor.apply(rec) : BigDecimal.ZERO;
            Integer isSettled = settledExtractor.apply(rec);
            Integer attendanceType = attendanceTypeExtractor.apply(rec);
            BigDecimal overtimeHours = overtimeHoursExtractor.apply(rec) != null ? overtimeHoursExtractor.apply(rec) : BigDecimal.ZERO;

            // 计算出勤天数（半天=0.5，全天=1，其他=0）
            BigDecimal attendanceDays = BigDecimal.ZERO;
            if (attendanceType != null) {
                if (attendanceType == 1) {
                    attendanceDays = new BigDecimal("0.5");
                } else if (attendanceType == 2) {
                    attendanceDays = BigDecimal.ONE;
                }
            }

            // 工资汇总
            if (isSettled == null || isSettled == 0) {
                vo.setTotalUnsettled(vo.getTotalUnsettled().add(wage));
            }

            if (!date.isBefore(startWorkDate) && !date.isAfter(today)) {
                vo.setYearTotal(vo.getYearTotal().add(wage));
                if (isSettled != null && isSettled == 1) {
                    vo.setYearSettled(vo.getYearSettled().add(wage));
                } else {
                    vo.setYearUnsettled(vo.getYearUnsettled().add(wage));
                }

                // 本年度出勤天数 & 加班时数
                vo.setYearAttendanceDays(vo.getYearAttendanceDays().add(attendanceDays));
                vo.setYearOvertimeHours(vo.getYearOvertimeHours().add(overtimeHours));
            } else if (date.isBefore(startWorkDate)) {
                if (isSettled == null || isSettled == 0) {
                    vo.setHistoricalUnsettled(vo.getHistoricalUnsettled().add(wage));
                }
            }

            // 本月出勤天数 & 加班时数
            if (YearMonth.from(date).equals(currentMonth)) {
                vo.setMonthAttendanceDays(vo.getMonthAttendanceDays().add(attendanceDays));
                vo.setMonthOvertimeHours(vo.getMonthOvertimeHours().add(overtimeHours));
            }
        }
        return vo;
    }

    /**
     * 将批次工人明细写入正式工人考勤记录表
     */
    private void insertWorkerRecordsFromItems(AttendanceBatchEntity batch) {
        if (batch == null || batch.getId() == null) {
            return;
        }
        LambdaQueryWrapper<AttendanceBatchWorkerItemEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AttendanceBatchWorkerItemEntity::getBatchId, batch.getId());
        List<AttendanceBatchWorkerItemEntity> items = workerItemMapper.selectList(wrapper);
        for (AttendanceBatchWorkerItemEntity item : items) {
            WorkerAttendanceRecordEntity record = new WorkerAttendanceRecordEntity();
            record.setBatchId(batch.getId());
            record.setDriverId(batch.getDriverId());
            record.setWorkerId(item.getWorkerId());
            record.setProjectId(item.getProjectId());
            record.setAttendanceDate(batch.getBatchDate());
            record.setAttendanceType(item.getAttendanceType());
            record.setOvertimeHours(item.getOvertimeHours() != null ? item.getOvertimeHours() : BigDecimal.ZERO);
            record.setWorkTypeId(item.getWorkTypeId());
            record.setDailyWage(item.getDailyWage());
            record.setOvertimeWage(item.getOvertimeWage());
            record.setTotalWage(item.getTotalWage());
            record.setRemark(item.getRemark());
            record.setIsSettled(0);
            workerRecordMapper.insert(record);
        }
        log.info("批次工人明细写入正式表: batchId={}, records={}", batch.getId(), items.size());
    }

    /**
     * 将批次司机明细写入正式司机考勤记录表
     */
    private void insertDriverRecordFromItem(AttendanceBatchEntity batch) {
        if (batch == null || batch.getId() == null) {
            return;
        }
        LambdaQueryWrapper<AttendanceBatchDriverItemEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AttendanceBatchDriverItemEntity::getBatchId, batch.getId());
        AttendanceBatchDriverItemEntity item = driverItemMapper.selectOne(wrapper);
        if (item == null) {
            log.warn("批次无司机明细，跳过写入正式表: batchId={}", batch.getId());
            return;
        }
        DriverAttendanceRecordEntity record = new DriverAttendanceRecordEntity();
        record.setDriverId(item.getDriverId());
        record.setAttendanceDate(item.getAttendanceDate());
        record.setAttendanceType(item.getAttendanceType());
        record.setOvertimeHours(item.getOvertimeHours() != null ? item.getOvertimeHours() : BigDecimal.ZERO);
        record.setWorkTypeId(null);
        record.setDailyWage(item.getDailyWage());
        record.setOvertimeWage(item.getOvertimeWage());
        record.setTotalWage(item.getTotalWage());
        record.setRemark(item.getRemark());
        record.setIsSettled(0);
        record.setSourceBatchId(batch.getId());
        driverRecordMapper.insert(record);
        log.info("批次司机明细写入正式表: batchId={}, driverId={}", batch.getId(), item.getDriverId());
    }

    /**
     * 创建与批次关联的司机考勤明细（保存到临时明细表）
     */
    private void createDriverItemForBatch(AttendanceBatchEntity batch, DriverEntity driver,
                                          BigDecimal overtimeHours, String remark) {
        if (batch == null || driver == null) {
            return;
        }

        BigDecimal dailyWage = driver.getBaseDailySalary() != null ? driver.getBaseDailySalary() : BigDecimal.ZERO;
        BigDecimal otHours = overtimeHours != null ? overtimeHours : BigDecimal.ZERO;
        BigDecimal overtimeWage = calculateDriverOvertimeWage(driver, otHours);
        BigDecimal totalWage = dailyWage.add(overtimeWage);

        AttendanceBatchDriverItemEntity record = new AttendanceBatchDriverItemEntity();
        record.setBatchId(batch.getId());
        record.setDriverId(batch.getDriverId());
        record.setAttendanceDate(batch.getBatchDate());
        record.setAttendanceType(2); // 全天
        record.setOvertimeHours(otHours);
        record.setDailyWage(dailyWage);
        record.setOvertimeWage(overtimeWage);
        record.setTotalWage(totalWage);
        record.setRemark(remark);
        driverItemMapper.insert(record);
        log.info("创建司机考勤明细: driverId={}, batchId={}", batch.getDriverId(), batch.getId());
    }

    /**
     * 构造默认司机考勤记录（批次尚无持久化司机记录时，仅用于前端展示）
     */
    private DriverAttendanceRecordEntity buildDefaultDriverRecord(AttendanceBatchEntity batch, DriverEntity driver) {
        DriverAttendanceRecordEntity record = new DriverAttendanceRecordEntity();
        record.setDriverId(batch.getDriverId());
        record.setAttendanceDate(batch.getBatchDate());
        record.setAttendanceType(2); // 全天
        record.setOvertimeHours(BigDecimal.ZERO);
        record.setWorkTypeId(null);
        if (driver != null) {
            BigDecimal dailyWage = driver.getBaseDailySalary() != null ? driver.getBaseDailySalary() : BigDecimal.ZERO;
            record.setDailyWage(dailyWage);
            record.setTotalWage(dailyWage);
        } else {
            record.setDailyWage(BigDecimal.ZERO);
            record.setTotalWage(BigDecimal.ZERO);
        }
        record.setOvertimeWage(BigDecimal.ZERO);
        record.setRemark(batch.getRemark());
        record.setIsSettled(0);
        record.setSourceBatchId(batch.getId());
        return record;
    }

    /**
     * 计算司机加班工资
     */
    private BigDecimal calculateDriverOvertimeWage(DriverEntity driver, BigDecimal overtimeHours) {
        if (overtimeHours == null || overtimeHours.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal rate = driver != null && driver.getOvertimeHourlyRate() != null
                ? driver.getOvertimeHourlyRate() : BigDecimal.ZERO;
        return rate.multiply(overtimeHours).setScale(2, RoundingMode.HALF_UP);
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

    // ==================== 结算相关 ====================

    @Override
    public SettlePreviewVO previewWorkerSettle(Long workerId, LocalDate dateFrom, LocalDate dateTo) {
        WorkerEntity worker = workerMapper.selectById(workerId);
        if (worker == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "工人不存在");
        }
        return buildSettlePreview(workerId, dateFrom, dateTo, worker.getBaseDailySalary(), worker.getOvertimeHourlyRate(), true);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void settleWorkerRecords(Long workerId, LocalDate dateFrom, LocalDate dateTo) {
        WorkerEntity worker = workerMapper.selectById(workerId);
        if (worker == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "工人不存在");
        }
        doSettle(workerId, dateFrom, dateTo, true);
    }

    @Override
    public SettlePreviewVO previewDriverSettle(Long driverId, LocalDate dateFrom, LocalDate dateTo) {
        DriverEntity driver = driverMapper.selectById(driverId);
        if (driver == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "司机不存在");
        }
        return buildSettlePreview(driverId, dateFrom, dateTo, driver.getBaseDailySalary(), driver.getOvertimeHourlyRate(), false);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void settleDriverRecords(Long driverId, LocalDate dateFrom, LocalDate dateTo) {
        DriverEntity driver = driverMapper.selectById(driverId);
        if (driver == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "司机不存在");
        }
        doSettle(driverId, dateFrom, dateTo, false);
    }

    private SettlePreviewVO buildSettlePreview(Long personId, LocalDate dateFrom, LocalDate dateTo,
                                                BigDecimal baseDailySalary, BigDecimal overtimeHourlyRate, boolean isWorker) {
        List<SettlePreviewVO.RecordItem> recordItems = new ArrayList<>();
        BigDecimal attendanceDays = BigDecimal.ZERO;
        BigDecimal totalOvertimeHours = BigDecimal.ZERO;
        BigDecimal totalAmount = BigDecimal.ZERO;

        if (isWorker) {
            LambdaQueryWrapper<WorkerAttendanceRecordEntity> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(WorkerAttendanceRecordEntity::getWorkerId, personId);
            wrapper.between(WorkerAttendanceRecordEntity::getAttendanceDate, dateFrom, dateTo);
            wrapper.orderByAsc(WorkerAttendanceRecordEntity::getAttendanceDate);
            List<WorkerAttendanceRecordEntity> records = workerRecordMapper.selectList(wrapper);

            for (WorkerAttendanceRecordEntity rec : records) {
                if (rec.getIsSettled() != null && rec.getIsSettled() == 1) continue;
                BigDecimal dayValue = rec.getAttendanceType() != null && rec.getAttendanceType() == 1
                        ? new BigDecimal("0.5") : BigDecimal.ONE;
                attendanceDays = attendanceDays.add(dayValue);
                totalOvertimeHours = totalOvertimeHours.add(rec.getOvertimeHours() != null ? rec.getOvertimeHours() : BigDecimal.ZERO);
                totalAmount = totalAmount.add(rec.getTotalWage() != null ? rec.getTotalWage() : BigDecimal.ZERO);

                SettlePreviewVO.RecordItem item = new SettlePreviewVO.RecordItem();
                item.setRecordId(rec.getId());
                item.setAttendanceDate(rec.getAttendanceDate().toString());
                item.setAttendanceType(rec.getAttendanceType());
                item.setAttendanceTypeText(rec.getAttendanceType() != null && rec.getAttendanceType() == 1 ? "半天" : "全天");
                item.setOvertimeHours(rec.getOvertimeHours());
                item.setTotalWage(rec.getTotalWage());
                recordItems.add(item);
            }
        } else {
            LambdaQueryWrapper<DriverAttendanceRecordEntity> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(DriverAttendanceRecordEntity::getDriverId, personId);
            wrapper.between(DriverAttendanceRecordEntity::getAttendanceDate, dateFrom, dateTo);
            wrapper.orderByAsc(DriverAttendanceRecordEntity::getAttendanceDate);
            List<DriverAttendanceRecordEntity> records = driverRecordMapper.selectList(wrapper);

            for (DriverAttendanceRecordEntity rec : records) {
                if (rec.getIsSettled() != null && rec.getIsSettled() == 1) continue;
                attendanceDays = attendanceDays.add(BigDecimal.ONE);
                totalOvertimeHours = totalOvertimeHours.add(rec.getOvertimeHours() != null ? rec.getOvertimeHours() : BigDecimal.ZERO);
                totalAmount = totalAmount.add(rec.getTotalWage() != null ? rec.getTotalWage() : BigDecimal.ZERO);

                SettlePreviewVO.RecordItem item = new SettlePreviewVO.RecordItem();
                item.setRecordId(rec.getId());
                item.setAttendanceDate(rec.getAttendanceDate().toString());
                item.setAttendanceType(rec.getAttendanceType());
                item.setAttendanceTypeText("全天");
                item.setOvertimeHours(rec.getOvertimeHours());
                item.setTotalWage(rec.getTotalWage());
                recordItems.add(item);
            }
        }

        BigDecimal base = baseDailySalary != null ? baseDailySalary : BigDecimal.ZERO;
        BigDecimal rate = overtimeHourlyRate != null ? overtimeHourlyRate : BigDecimal.ZERO;

        // 工资计算式: days × base + hours × rate = total
        StringBuilder formula = new StringBuilder();
        if (attendanceDays.compareTo(BigDecimal.ZERO) > 0) {
            formula.append(attendanceDays.stripTrailingZeros().toPlainString()).append("×").append(base.stripTrailingZeros().toPlainString());
        }
        if (totalOvertimeHours.compareTo(BigDecimal.ZERO) > 0) {
            if (formula.length() > 0) formula.append("+");
            formula.append(totalOvertimeHours.stripTrailingZeros().toPlainString()).append("×").append(rate.stripTrailingZeros().toPlainString());
        }
        if (formula.length() > 0) {
            formula.append("=").append(totalAmount.stripTrailingZeros().toPlainString()).append("￥");
        } else {
            formula.append("0￥");
        }

        SettlePreviewVO vo = new SettlePreviewVO();
        vo.setDateFrom(dateFrom.toString());
        vo.setDateTo(dateTo.toString());
        vo.setRecords(recordItems);
        vo.setAttendanceDays(attendanceDays.setScale(1, RoundingMode.HALF_UP));
        vo.setTotalOvertimeHours(totalOvertimeHours.setScale(1, RoundingMode.HALF_UP));
        vo.setBaseDailySalary(base);
        vo.setOvertimeHourlyRate(rate);
        vo.setFormula(formula.toString());
        vo.setTotalAmount(totalAmount.setScale(2, RoundingMode.HALF_UP));
        return vo;
    }

    private void doSettle(Long personId, LocalDate dateFrom, LocalDate dateTo, boolean isWorker) {
        if (isWorker) {
            LambdaQueryWrapper<WorkerAttendanceRecordEntity> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(WorkerAttendanceRecordEntity::getWorkerId, personId);
            wrapper.between(WorkerAttendanceRecordEntity::getAttendanceDate, dateFrom, dateTo);
            wrapper.eq(WorkerAttendanceRecordEntity::getIsSettled, 0);
            List<WorkerAttendanceRecordEntity> records = workerRecordMapper.selectList(wrapper);

            for (WorkerAttendanceRecordEntity rec : records) {
                rec.setIsSettled(1);
                rec.setSettledTime(LocalDateTime.now());
                rec.setSettledBy(SecurityUtils.getCurrentUserId());
                workerRecordMapper.updateById(rec);
            }
            log.info("工人考勤记录结算完成: workerId={}, count={}", personId, records.size());
        } else {
            LambdaQueryWrapper<DriverAttendanceRecordEntity> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(DriverAttendanceRecordEntity::getDriverId, personId);
            wrapper.between(DriverAttendanceRecordEntity::getAttendanceDate, dateFrom, dateTo);
            wrapper.eq(DriverAttendanceRecordEntity::getIsSettled, 0);
            List<DriverAttendanceRecordEntity> records = driverRecordMapper.selectList(wrapper);

            for (DriverAttendanceRecordEntity rec : records) {
                rec.setIsSettled(1);
                rec.setSettledTime(LocalDateTime.now());
                rec.setSettledBy(SecurityUtils.getCurrentUserId());
                driverRecordMapper.updateById(rec);
            }
            log.info("司机考勤记录结算完成: driverId={}, count={}", personId, records.size());
        }
    }

    // ==================== 月度考勤报表 ====================

    @Override
    public List<MonthOptionVO> listAttendanceMonths() {
        Set<java.time.YearMonth> monthSet = new HashSet<>();

        for (Map<String, Object> row : workerRecordMapper.selectDistinctMonths()) {
            monthSet.add(toYearMonth(row));
        }
        for (Map<String, Object> row : driverRecordMapper.selectDistinctMonths()) {
            monthSet.add(toYearMonth(row));
        }

        return monthSet.stream()
                .sorted(Comparator.reverseOrder())
                .map(ym -> new MonthOptionVO(ym.getYear(), ym.getMonthValue(),
                        ym.getYear() + "年" + ym.getMonthValue() + "月"))
                .collect(Collectors.toList());
    }

    @Override
    public List<GroupOptionVO> listWorkerGroupsWithRecords(Integer year, Integer month) {
        List<Long> groupIds = workerRecordMapper.selectGroupIdsByMonth(year, month);
        if (groupIds.isEmpty()) {
            return new ArrayList<>();
        }

        LambdaQueryWrapper<GroupEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(GroupEntity::getId, groupIds);
        wrapper.orderByAsc(GroupEntity::getId);
        return groupMapper.selectList(wrapper).stream()
                .map(g -> new GroupOptionVO(g.getId(), g.getGroupName()))
                .collect(Collectors.toList());
    }

    @Override
    public MonthlyReportVO getWorkerMonthlyReport(Integer year, Integer month, Long groupId) {
        YearMonth ym = YearMonth.of(year, month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        GroupEntity group = groupMapper.selectById(groupId);
        String groupName = group != null ? group.getGroupName() : "-";

        // 查询该组别下所有在职工人
        LambdaQueryWrapper<WorkerEntity> workerWrapper = new LambdaQueryWrapper<>();
        workerWrapper.eq(WorkerEntity::getGroupId, groupId);
        workerWrapper.eq(WorkerEntity::getIsEmployed, 1);
        workerWrapper.orderByAsc(WorkerEntity::getId);
        List<WorkerEntity> workers = workerMapper.selectList(workerWrapper);

        // 查询该组别工人在该月的所有考勤记录
        List<Long> workerIds = workers.stream().map(WorkerEntity::getId).collect(Collectors.toList());
        List<WorkerAttendanceRecordEntity> records = new ArrayList<>();
        if (!workerIds.isEmpty()) {
            LambdaQueryWrapper<WorkerAttendanceRecordEntity> recordWrapper = new LambdaQueryWrapper<>();
            recordWrapper.in(WorkerAttendanceRecordEntity::getWorkerId, workerIds);
            recordWrapper.between(WorkerAttendanceRecordEntity::getAttendanceDate, start, end);
            records = workerRecordMapper.selectList(recordWrapper);
        }

        Map<Long, Map<Integer, WorkerAttendanceRecordEntity>> workerDayMap = new HashMap<>();
        for (WorkerAttendanceRecordEntity rec : records) {
            workerDayMap
                    .computeIfAbsent(rec.getWorkerId(), k -> new HashMap<>())
                    .put(rec.getAttendanceDate().getDayOfMonth(), rec);
        }

        List<MonthlyReportRecordVO> reportRecords = new ArrayList<>();
        int seq = 1;
        for (WorkerEntity worker : workers) {
            MonthlyReportRecordVO record = buildWorkerReportRecord(worker, workerDayMap.getOrDefault(worker.getId(), Collections.emptyMap()), ym, seq++);
            reportRecords.add(record);
        }

        MonthlyReportRecordVO summary = buildSummary(reportRecords, ym);

        MonthlyReportVO report = new MonthlyReportVO();
        report.setYear(year);
        report.setMonth(month);
        report.setGroupName(groupName);
        report.setDaysInMonth(ym.lengthOfMonth());
        report.setRecords(reportRecords);
        report.setSummary(summary);
        return report;
    }

    @Override
    public MonthlyReportVO getDriverMonthlyReport(Integer year, Integer month) {
        YearMonth ym = YearMonth.of(year, month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        // 查询所有在职司机
        LambdaQueryWrapper<DriverEntity> driverWrapper = new LambdaQueryWrapper<>();
        driverWrapper.eq(DriverEntity::getIsActive, 1);
        driverWrapper.orderByAsc(DriverEntity::getId);
        List<DriverEntity> drivers = driverMapper.selectList(driverWrapper);

        // 查询司机在该月的所有考勤记录
        List<Long> driverIds = drivers.stream().map(DriverEntity::getId).collect(Collectors.toList());
        List<DriverAttendanceRecordEntity> records = new ArrayList<>();
        if (!driverIds.isEmpty()) {
            LambdaQueryWrapper<DriverAttendanceRecordEntity> recordWrapper = new LambdaQueryWrapper<>();
            recordWrapper.in(DriverAttendanceRecordEntity::getDriverId, driverIds);
            recordWrapper.between(DriverAttendanceRecordEntity::getAttendanceDate, start, end);
            records = driverRecordMapper.selectList(recordWrapper);
        }

        Map<Long, Map<Integer, DriverAttendanceRecordEntity>> driverDayMap = new HashMap<>();
        for (DriverAttendanceRecordEntity rec : records) {
            driverDayMap
                    .computeIfAbsent(rec.getDriverId(), k -> new HashMap<>())
                    .put(rec.getAttendanceDate().getDayOfMonth(), rec);
        }

        List<MonthlyReportRecordVO> reportRecords = new ArrayList<>();
        int seq = 1;
        for (DriverEntity driver : drivers) {
            MonthlyReportRecordVO record = buildDriverReportRecord(driver, driverDayMap.getOrDefault(driver.getId(), Collections.emptyMap()), ym, seq++);
            reportRecords.add(record);
        }

        MonthlyReportRecordVO summary = buildSummary(reportRecords, ym);

        MonthlyReportVO report = new MonthlyReportVO();
        report.setYear(year);
        report.setMonth(month);
        report.setGroupName("司机");
        report.setDaysInMonth(ym.lengthOfMonth());
        report.setRecords(reportRecords);
        report.setSummary(summary);
        return report;
    }

    // ==================== 月度报表私有辅助方法 ====================

    private java.time.YearMonth toYearMonth(Map<String, Object> row) {
        Integer year = ((Number) row.get("year")).intValue();
        Integer month = ((Number) row.get("month")).intValue();
        return java.time.YearMonth.of(year, month);
    }

    private MonthlyReportRecordVO buildWorkerReportRecord(WorkerEntity worker,
                                                           Map<Integer, WorkerAttendanceRecordEntity> dayMap,
                                                           YearMonth ym, int seq) {
        MonthlyReportRecordVO vo = new MonthlyReportRecordVO();
        vo.setNo(seq);
        vo.setName(worker.getName());
        vo.setDailyWages(buildDailyWages(ym, dayMap, true));
        vo.setAttendanceDays(calculateAttendanceDays(dayMap.values()));
        vo.setOvertimeHours(sumOvertimeHours(dayMap.values(), r -> r.getOvertimeHours()));
        vo.setTotalWage(sumWage(dayMap.values(), WorkerAttendanceRecordEntity::getTotalWage));
        vo.setRemark("");
        return vo;
    }

    private MonthlyReportRecordVO buildDriverReportRecord(DriverEntity driver,
                                                           Map<Integer, DriverAttendanceRecordEntity> dayMap,
                                                           YearMonth ym, int seq) {
        MonthlyReportRecordVO vo = new MonthlyReportRecordVO();
        vo.setNo(seq);
        vo.setName(driver.getRealName());
        vo.setDailyWages(buildDailyWages(ym, dayMap, true));
        vo.setAttendanceDays(BigDecimal.valueOf(dayMap.size()));
        vo.setOvertimeHours(sumOvertimeHours(dayMap.values(), r -> r.getOvertimeHours()));
        vo.setTotalWage(sumWage(dayMap.values(), DriverAttendanceRecordEntity::getTotalWage));
        vo.setRemark("");
        return vo;
    }

    private <T> List<MonthlyReportDayVO> buildDailyWages(YearMonth ym, Map<Integer, T> dayMap,
                                                          java.util.function.Function<T, BigDecimal> wageExtractor,
                                                          java.util.function.Function<T, BigDecimal> overtimeExtractor) {
        List<MonthlyReportDayVO> days = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (int d = 1; d <= ym.lengthOfMonth(); d++) {
            MonthlyReportDayVO day = new MonthlyReportDayVO();
            day.setDay(d);

            LocalDate date = ym.atDay(d);
            if (date.isAfter(today)) {
                // 今天之后的日期不显示
                day.setEmpty(true);
                day.setWage(BigDecimal.ZERO);
                day.setOvertimeHours(BigDecimal.ZERO);
            } else {
                T rec = dayMap.get(d);
                if (rec != null) {
                    day.setEmpty(false);
                    day.setWage(wageExtractor.apply(rec) != null ? wageExtractor.apply(rec) : BigDecimal.ZERO);
                    BigDecimal ot = overtimeExtractor.apply(rec);
                    day.setOvertimeHours(ot != null ? ot : BigDecimal.ZERO);
                } else {
                    day.setEmpty(true);
                    day.setWage(BigDecimal.ZERO);
                    day.setOvertimeHours(BigDecimal.ZERO);
                }
            }
            days.add(day);
        }
        return days;
    }

    private List<MonthlyReportDayVO> buildDailyWages(YearMonth ym, Map<Integer, WorkerAttendanceRecordEntity> dayMap, boolean isWorker) {
        return buildDailyWages(ym, dayMap, WorkerAttendanceRecordEntity::getDailyWage, WorkerAttendanceRecordEntity::getOvertimeHours);
    }

    private List<MonthlyReportDayVO> buildDailyWages(YearMonth ym, Map<Integer, DriverAttendanceRecordEntity> dayMap, Object ignored) {
        return buildDailyWages(ym, dayMap, DriverAttendanceRecordEntity::getDailyWage, DriverAttendanceRecordEntity::getOvertimeHours);
    }

    private BigDecimal calculateAttendanceDays(Collection<WorkerAttendanceRecordEntity> records) {
        BigDecimal days = BigDecimal.ZERO;
        for (WorkerAttendanceRecordEntity rec : records) {
            if (rec.getAttendanceType() != null && rec.getAttendanceType() == 1) {
                days = days.add(new BigDecimal("0.5"));
            } else if (rec.getAttendanceType() != null && rec.getAttendanceType() == 2) {
                days = days.add(BigDecimal.ONE);
            }
        }
        return days;
    }

    private <T> BigDecimal sumOvertimeHours(Collection<T> records, java.util.function.Function<T, BigDecimal> extractor) {
        BigDecimal sum = BigDecimal.ZERO;
        for (T rec : records) {
            BigDecimal val = extractor.apply(rec);
            if (val != null) {
                sum = sum.add(val);
            }
        }
        return sum;
    }

    private <T> BigDecimal sumWage(Collection<T> records, java.util.function.Function<T, BigDecimal> extractor) {
        BigDecimal sum = BigDecimal.ZERO;
        for (T rec : records) {
            BigDecimal val = extractor.apply(rec);
            if (val != null) {
                sum = sum.add(val);
            }
        }
        return sum;
    }

    private MonthlyReportRecordVO buildSummary(List<MonthlyReportRecordVO> records, YearMonth ym) {
        MonthlyReportRecordVO summary = new MonthlyReportRecordVO();
        summary.setNo(null);
        summary.setName("合计");

        List<MonthlyReportDayVO> summaryDays = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (int d = 1; d <= ym.lengthOfMonth(); d++) {
            MonthlyReportDayVO day = new MonthlyReportDayVO();
            day.setDay(d);
            if (ym.atDay(d).isAfter(today)) {
                day.setEmpty(true);
                day.setWage(BigDecimal.ZERO);
                day.setOvertimeHours(BigDecimal.ZERO);
            } else {
                final int dayNum = d;
                BigDecimal dayTotal = BigDecimal.ZERO;
                for (MonthlyReportRecordVO rec : records) {
                    MonthlyReportDayVO rd = rec.getDailyWages().get(dayNum - 1);
                    if (!rd.isEmpty() && rd.getWage() != null) {
                        dayTotal = dayTotal.add(rd.getWage());
                    }
                }
                day.setEmpty(dayTotal.compareTo(BigDecimal.ZERO) == 0);
                day.setWage(dayTotal);
                day.setOvertimeHours(BigDecimal.ZERO);
            }
            summaryDays.add(day);
        }
        summary.setDailyWages(summaryDays);

        BigDecimal totalAttendanceDays = BigDecimal.ZERO;
        BigDecimal totalOvertimeHours = BigDecimal.ZERO;
        BigDecimal totalWage = BigDecimal.ZERO;
        for (MonthlyReportRecordVO rec : records) {
            if (rec.getAttendanceDays() != null) {
                totalAttendanceDays = totalAttendanceDays.add(rec.getAttendanceDays());
            }
            if (rec.getOvertimeHours() != null) {
                totalOvertimeHours = totalOvertimeHours.add(rec.getOvertimeHours());
            }
            if (rec.getTotalWage() != null) {
                totalWage = totalWage.add(rec.getTotalWage());
            }
        }
        summary.setAttendanceDays(totalAttendanceDays);
        summary.setOvertimeHours(totalOvertimeHours);
        summary.setTotalWage(totalWage);
        summary.setRemark("");
        return summary;
    }
}
