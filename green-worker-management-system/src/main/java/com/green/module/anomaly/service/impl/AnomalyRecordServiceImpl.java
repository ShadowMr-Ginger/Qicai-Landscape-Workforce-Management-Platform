package com.green.module.anomaly.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.green.common.exception.BusinessException;
import com.green.common.result.ResultCodeEnum;
import com.green.module.anomaly.constants.AnomalyStatusEnum;
import com.green.module.anomaly.constants.AnomalySubTypeEnum;
import com.green.module.anomaly.constants.AnomalyTypeEnum;
import com.green.module.anomaly.dto.AnomalyRecordQuery;
import com.green.module.anomaly.entity.AnomalyRecordEntity;
import com.green.module.anomaly.mapper.AnomalyRecordMapper;
import com.green.module.anomaly.service.AnomalyRecordService;
import com.green.module.anomaly.vo.AnomalyRecordVO;
import com.green.module.attendance.entity.AttendanceBatchEntity;
import com.green.module.attendance.entity.DriverAttendanceRecordEntity;
import com.green.module.attendance.entity.WorkerAttendanceRecordEntity;
import com.green.module.attendance.mapper.AttendanceBatchMapper;
import com.green.module.attendance.mapper.DriverAttendanceRecordMapper;
import com.green.module.attendance.mapper.WorkerAttendanceRecordMapper;
import com.green.module.driver.entity.DriverEntity;
import com.green.module.driver.mapper.DriverMapper;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 异常记录服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnomalyRecordServiceImpl implements AnomalyRecordService {

    private final AnomalyRecordMapper anomalyRecordMapper;
    private final WorkerMapper workerMapper;
    private final DriverMapper driverMapper;
    private final WorkerAttendanceRecordMapper workerRecordMapper;
    private final DriverAttendanceRecordMapper driverRecordMapper;
    private final AttendanceBatchMapper batchMapper;
    private final AdminMapper adminMapper;

    @Override
    public IPage<AnomalyRecordVO> list(AnomalyRecordQuery query) {
        Page<AnomalyRecordEntity> page = new Page<>(query.getPageNum(), query.getPageSize());
        LambdaQueryWrapper<AnomalyRecordEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(AnomalyRecordEntity::getCreateTime);

        if (query.getType() != null) {
            wrapper.eq(AnomalyRecordEntity::getType, query.getType());
        }
        if (query.getSubType() != null) {
            wrapper.eq(AnomalyRecordEntity::getSubType, query.getSubType());
        }
        if (query.getStatus() != null) {
            wrapper.eq(AnomalyRecordEntity::getStatus, query.getStatus());
        }
        if (StringUtils.hasText(query.getKeyword())) {
            wrapper.and(w -> w.like(AnomalyRecordEntity::getTitle, query.getKeyword())
                    .or()
                    .like(AnomalyRecordEntity::getDescription, query.getKeyword()));
        }

        IPage<AnomalyRecordEntity> entityPage = anomalyRecordMapper.selectPage(page, wrapper);
        List<AnomalyRecordVO> voList = entityPage.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());

        Page<AnomalyRecordVO> result = new Page<>(entityPage.getCurrent(), entityPage.getSize(), entityPage.getTotal());
        result.setRecords(voList);
        return result;
    }

    @Override
    public AnomalyRecordVO detail(Long id) {
        AnomalyRecordEntity entity = anomalyRecordMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "异常记录不存在");
        }
        return convertToVO(entity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void resolve(Long id) {
        AnomalyRecordEntity entity = anomalyRecordMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "异常记录不存在");
        }
        if (AnomalyStatusEnum.RESOLVED.getCode().equals(entity.getStatus())) {
            return;
        }
        entity.setStatus(AnomalyStatusEnum.RESOLVED.getCode());
        entity.setResolvedTime(LocalDateTime.now());
        entity.setResolvedBy(SecurityUtils.getCurrentUserId());
        anomalyRecordMapper.updateById(entity);
        log.info("异常记录已处理: anomalyId={}", id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        AnomalyRecordEntity entity = anomalyRecordMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "异常记录不存在");
        }
        anomalyRecordMapper.deleteById(id);
        log.info("删除异常记录: anomalyId={}", id);
    }

    @Override
    public long countUnresolved() {
        LambdaQueryWrapper<AnomalyRecordEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AnomalyRecordEntity::getStatus, AnomalyStatusEnum.UNRESOLVED.getCode());
        return anomalyRecordMapper.selectCount(wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void checkWorkerNameDuplicate(Long workerId, String name) {
        if (!StringUtils.hasText(name)) {
            return;
        }
        LambdaQueryWrapper<WorkerEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(WorkerEntity::getName, name);
        if (workerId != null) {
            wrapper.ne(WorkerEntity::getId, workerId);
        }
        wrapper.eq(WorkerEntity::getIsEmployed, 1);
        long count = workerMapper.selectCount(wrapper);

        if (count > 0) {
            String title = "工人重名：" + name;
            String description = String.format("检测到 %d 个同名在职工人（含当前工人），可能影响小程序端搜索。", count + 1);
            createOrUpdateAnomaly(AnomalyTypeEnum.DUPLICATE_NAME.getCode(),
                    AnomalySubTypeEnum.WORKER.getCode(),
                    workerId, title, description,
                    "/workers", null);
        } else {
            // 无重复时，关闭该对象对应的未处理异常
            closeAnomaly(AnomalyTypeEnum.DUPLICATE_NAME.getCode(),
                    AnomalySubTypeEnum.WORKER.getCode(),
                    workerId);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void checkDriverNameDuplicate(Long driverId, String realName) {
        if (!StringUtils.hasText(realName)) {
            return;
        }
        LambdaQueryWrapper<DriverEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DriverEntity::getRealName, realName);
        if (driverId != null) {
            wrapper.ne(DriverEntity::getId, driverId);
        }
        wrapper.eq(DriverEntity::getIsActive, 1);
        long count = driverMapper.selectCount(wrapper);

        if (count > 0) {
            String title = "司机重名：" + realName;
            String description = String.format("检测到 %d 个同名在职司机（含当前司机），可能影响小程序端搜索。", count + 1);
            createOrUpdateAnomaly(AnomalyTypeEnum.DUPLICATE_NAME.getCode(),
                    AnomalySubTypeEnum.DRIVER.getCode(),
                    driverId, title, description,
                    "/drivers", null);
        } else {
            closeAnomaly(AnomalyTypeEnum.DUPLICATE_NAME.getCode(),
                    AnomalySubTypeEnum.DRIVER.getCode(),
                    driverId);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void checkAttendanceDuplicateAfterBatchReview(Long batchId) {
        AttendanceBatchEntity batch = batchMapper.selectById(batchId);
        if (batch == null || batch.getBatchDate() == null) {
            return;
        }
        LocalDate batchDate = batch.getBatchDate();

        // 1. 检查该批次下所有工人是否存在重复考勤
        LambdaQueryWrapper<WorkerAttendanceRecordEntity> workerWrapper = new LambdaQueryWrapper<>();
        workerWrapper.eq(WorkerAttendanceRecordEntity::getBatchId, batchId);
        List<WorkerAttendanceRecordEntity> workerRecords = workerRecordMapper.selectList(workerWrapper);

        Set<Long> workerIds = workerRecords.stream()
                .map(WorkerAttendanceRecordEntity::getWorkerId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        for (Long workerId : workerIds) {
            LambdaQueryWrapper<WorkerAttendanceRecordEntity> countWrapper = new LambdaQueryWrapper<>();
            countWrapper.eq(WorkerAttendanceRecordEntity::getWorkerId, workerId)
                    .eq(WorkerAttendanceRecordEntity::getAttendanceDate, batchDate);
            long recordCount = workerRecordMapper.selectCount(countWrapper);

            if (recordCount > 1) {
                WorkerEntity worker = workerMapper.selectById(workerId);
                String workerName = worker != null ? worker.getName() : "未知工人";
                String title = String.format("工人重复考勤：%s", workerName);
                String description = String.format("工人 %s 在 %s 存在 %d 条考勤记录。", workerName, batchDate, recordCount);
                createOrUpdateAnomaly(AnomalyTypeEnum.DUPLICATE_ATTENDANCE.getCode(),
                        AnomalySubTypeEnum.WORKER.getCode(),
                        workerId, title, description,
                        "/worker-records", batchDate);
            } else {
                closeAnomalyByRelated(AnomalyTypeEnum.DUPLICATE_ATTENDANCE.getCode(),
                        AnomalySubTypeEnum.WORKER.getCode(),
                        workerId, batchDate);
            }
        }

        // 2. 检查司机是否存在重复考勤
        Long driverId = batch.getDriverId();
        if (driverId != null) {
            LambdaQueryWrapper<DriverAttendanceRecordEntity> driverWrapper = new LambdaQueryWrapper<>();
            driverWrapper.eq(DriverAttendanceRecordEntity::getDriverId, driverId)
                    .eq(DriverAttendanceRecordEntity::getAttendanceDate, batchDate);
            long driverRecordCount = driverRecordMapper.selectCount(driverWrapper);

            if (driverRecordCount > 1) {
                DriverEntity driver = driverMapper.selectById(driverId);
                String driverName = driver != null ? driver.getRealName() : "未知司机";
                String title = String.format("司机重复考勤：%s", driverName);
                String description = String.format("司机 %s 在 %s 存在 %d 条考勤记录。", driverName, batchDate, driverRecordCount);
                createOrUpdateAnomaly(AnomalyTypeEnum.DUPLICATE_ATTENDANCE.getCode(),
                        AnomalySubTypeEnum.DRIVER.getCode(),
                        driverId, title, description,
                        "/driver-records", batchDate);
            } else {
                closeAnomalyByRelated(AnomalyTypeEnum.DUPLICATE_ATTENDANCE.getCode(),
                        AnomalySubTypeEnum.DRIVER.getCode(),
                        driverId, batchDate);
            }
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void checkOvertimeAfterBatchReview(Long batchId) {
        AttendanceBatchEntity batch = batchMapper.selectById(batchId);
        if (batch == null || batch.getBatchDate() == null) {
            return;
        }
        LocalDate batchDate = batch.getBatchDate();
        BigDecimal overtimeThreshold = new BigDecimal("10");

        // 1. 检查工人超长加班
        LambdaQueryWrapper<WorkerAttendanceRecordEntity> workerWrapper = new LambdaQueryWrapper<>();
        workerWrapper.eq(WorkerAttendanceRecordEntity::getBatchId, batchId)
                .gt(WorkerAttendanceRecordEntity::getOvertimeHours, overtimeThreshold);
        List<WorkerAttendanceRecordEntity> overtimeWorkers = workerRecordMapper.selectList(workerWrapper);

        for (WorkerAttendanceRecordEntity record : overtimeWorkers) {
            WorkerEntity worker = workerMapper.selectById(record.getWorkerId());
            String workerName = worker != null ? worker.getName() : "未知工人";
            String title = String.format("工人超长加班：%s", workerName);
            String description = String.format("工人 %s 在 %s 的加班时长为 %.1f 小时，超过 10 小时阈值。",
                    workerName, batchDate, record.getOvertimeHours());
            createOrUpdateAnomaly(AnomalyTypeEnum.OVERTIME_TOO_LONG.getCode(),
                    AnomalySubTypeEnum.WORKER.getCode(),
                    record.getWorkerId(), title, description,
                    "/worker-records", batchDate);
        }

        // 2. 检查司机超长加班
        Long driverId = batch.getDriverId();
        if (driverId != null) {
            LambdaQueryWrapper<DriverAttendanceRecordEntity> driverWrapper = new LambdaQueryWrapper<>();
            driverWrapper.eq(DriverAttendanceRecordEntity::getDriverId, driverId)
                    .eq(DriverAttendanceRecordEntity::getAttendanceDate, batchDate)
                    .gt(DriverAttendanceRecordEntity::getOvertimeHours, overtimeThreshold);
            List<DriverAttendanceRecordEntity> overtimeDrivers = driverRecordMapper.selectList(driverWrapper);

            for (DriverAttendanceRecordEntity record : overtimeDrivers) {
                DriverEntity driver = driverMapper.selectById(record.getDriverId());
                String driverName = driver != null ? driver.getRealName() : "未知司机";
                String title = String.format("司机超长加班：%s", driverName);
                String description = String.format("司机 %s 在 %s 的加班时长为 %.1f 小时，超过 10 小时阈值。",
                        driverName, batchDate, record.getOvertimeHours());
                createOrUpdateAnomaly(AnomalyTypeEnum.OVERTIME_TOO_LONG.getCode(),
                        AnomalySubTypeEnum.DRIVER.getCode(),
                        driverId, title, description,
                        "/driver-records", batchDate);
            }
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int runGlobalCheck() {
        log.info("开始执行全局异常检测");
        int affected = 0;

        // 1. 全局重名检测 - 工人
        LambdaQueryWrapper<WorkerEntity> workerWrapper = new LambdaQueryWrapper<>();
        workerWrapper.eq(WorkerEntity::getIsEmployed, 1);
        List<WorkerEntity> allWorkers = workerMapper.selectList(workerWrapper);
        Map<String, List<WorkerEntity>> workerNameGroups = allWorkers.stream()
                .filter(w -> StringUtils.hasText(w.getName()))
                .collect(Collectors.groupingBy(WorkerEntity::getName));
        for (Map.Entry<String, List<WorkerEntity>> entry : workerNameGroups.entrySet()) {
            if (entry.getValue().size() > 1) {
                for (WorkerEntity worker : entry.getValue()) {
                    checkWorkerNameDuplicate(worker.getId(), worker.getName());
                    affected++;
                }
            } else {
                // 已无重复，关闭该工人的未处理异常
                closeAnomaly(AnomalyTypeEnum.DUPLICATE_NAME.getCode(),
                        AnomalySubTypeEnum.WORKER.getCode(),
                        entry.getValue().get(0).getId());
            }
        }

        // 2. 全局重名检测 - 司机
        LambdaQueryWrapper<DriverEntity> driverWrapper = new LambdaQueryWrapper<>();
        driverWrapper.eq(DriverEntity::getIsActive, 1);
        List<DriverEntity> allDrivers = driverMapper.selectList(driverWrapper);
        Map<String, List<DriverEntity>> driverNameGroups = allDrivers.stream()
                .filter(d -> StringUtils.hasText(d.getRealName()))
                .collect(Collectors.groupingBy(DriverEntity::getRealName));
        for (Map.Entry<String, List<DriverEntity>> entry : driverNameGroups.entrySet()) {
            if (entry.getValue().size() > 1) {
                for (DriverEntity driver : entry.getValue()) {
                    checkDriverNameDuplicate(driver.getId(), driver.getRealName());
                    affected++;
                }
            } else {
                closeAnomaly(AnomalyTypeEnum.DUPLICATE_NAME.getCode(),
                        AnomalySubTypeEnum.DRIVER.getCode(),
                        entry.getValue().get(0).getId());
            }
        }

        // 3. 全局重复考勤检测 - 工人
        // 先查询所有存在重复的 workerId + date 组合
        List<WorkerAttendanceRecordEntity> allWorkerRecords = workerRecordMapper.selectList(
                new LambdaQueryWrapper<WorkerAttendanceRecordEntity>());
        Map<String, List<WorkerAttendanceRecordEntity>> workerRecordGroups = allWorkerRecords.stream()
                .filter(r -> r.getWorkerId() != null && r.getAttendanceDate() != null)
                .collect(Collectors.groupingBy(r -> r.getWorkerId() + "#" + r.getAttendanceDate()));
        Set<String> duplicateWorkerKeys = workerRecordGroups.entrySet().stream()
                .filter(e -> e.getValue().size() > 1)
                .map(Map.Entry::getKey)
                .collect(Collectors.toSet());
        for (String key : duplicateWorkerKeys) {
            List<WorkerAttendanceRecordEntity> records = workerRecordGroups.get(key);
            WorkerAttendanceRecordEntity sample = records.get(0);
            long recordCount = records.size();
            WorkerEntity worker = workerMapper.selectById(sample.getWorkerId());
            String workerName = worker != null ? worker.getName() : "未知工人";
            String title = String.format("工人重复考勤：%s", workerName);
            String description = String.format("工人 %s 在 %s 存在 %d 条考勤记录。", workerName, sample.getAttendanceDate(), recordCount);
            createOrUpdateAnomaly(AnomalyTypeEnum.DUPLICATE_ATTENDANCE.getCode(),
                    AnomalySubTypeEnum.WORKER.getCode(),
                    sample.getWorkerId(), title, description,
                    "/worker-records", sample.getAttendanceDate());
            affected++;
        }
        // 关闭已无重复的异常
        LambdaQueryWrapper<AnomalyRecordEntity> dupWorkerAnomalyWrapper = new LambdaQueryWrapper<>();
        dupWorkerAnomalyWrapper.eq(AnomalyRecordEntity::getType, AnomalyTypeEnum.DUPLICATE_ATTENDANCE.getCode())
                .eq(AnomalyRecordEntity::getSubType, AnomalySubTypeEnum.WORKER.getCode())
                .eq(AnomalyRecordEntity::getStatus, AnomalyStatusEnum.UNRESOLVED.getCode());
        List<AnomalyRecordEntity> unresolvedWorkerDup = anomalyRecordMapper.selectList(dupWorkerAnomalyWrapper);
        for (AnomalyRecordEntity anomaly : unresolvedWorkerDup) {
            String key = anomaly.getRelatedId() + "#" + anomaly.getRelatedDate();
            if (!duplicateWorkerKeys.contains(key)) {
                anomalyRecordMapper.deleteById(anomaly.getId());
            }
        }

        // 4. 全局重复考勤检测 - 司机
        List<DriverAttendanceRecordEntity> allDriverRecords = driverRecordMapper.selectList(
                new LambdaQueryWrapper<DriverAttendanceRecordEntity>());
        Map<String, List<DriverAttendanceRecordEntity>> driverRecordGroups = allDriverRecords.stream()
                .filter(r -> r.getDriverId() != null && r.getAttendanceDate() != null)
                .collect(Collectors.groupingBy(r -> r.getDriverId() + "#" + r.getAttendanceDate()));
        Set<String> duplicateDriverKeys = driverRecordGroups.entrySet().stream()
                .filter(e -> e.getValue().size() > 1)
                .map(Map.Entry::getKey)
                .collect(Collectors.toSet());
        for (String key : duplicateDriverKeys) {
            List<DriverAttendanceRecordEntity> records = driverRecordGroups.get(key);
            DriverAttendanceRecordEntity sample = records.get(0);
            long recordCount = records.size();
            DriverEntity driver = driverMapper.selectById(sample.getDriverId());
            String driverName = driver != null ? driver.getRealName() : "未知司机";
            String title = String.format("司机重复考勤：%s", driverName);
            String description = String.format("司机 %s 在 %s 存在 %d 条考勤记录。", driverName, sample.getAttendanceDate(), recordCount);
            createOrUpdateAnomaly(AnomalyTypeEnum.DUPLICATE_ATTENDANCE.getCode(),
                    AnomalySubTypeEnum.DRIVER.getCode(),
                    sample.getDriverId(), title, description,
                    "/driver-records", sample.getAttendanceDate());
            affected++;
        }
        LambdaQueryWrapper<AnomalyRecordEntity> dupDriverAnomalyWrapper = new LambdaQueryWrapper<>();
        dupDriverAnomalyWrapper.eq(AnomalyRecordEntity::getType, AnomalyTypeEnum.DUPLICATE_ATTENDANCE.getCode())
                .eq(AnomalyRecordEntity::getSubType, AnomalySubTypeEnum.DRIVER.getCode())
                .eq(AnomalyRecordEntity::getStatus, AnomalyStatusEnum.UNRESOLVED.getCode());
        List<AnomalyRecordEntity> unresolvedDriverDup = anomalyRecordMapper.selectList(dupDriverAnomalyWrapper);
        for (AnomalyRecordEntity anomaly : unresolvedDriverDup) {
            String key = anomaly.getRelatedId() + "#" + anomaly.getRelatedDate();
            if (!duplicateDriverKeys.contains(key)) {
                anomalyRecordMapper.deleteById(anomaly.getId());
            }
        }

        // 5. 全局超长加班检测 - 工人
        BigDecimal overtimeThreshold = new BigDecimal("10");
        LambdaQueryWrapper<WorkerAttendanceRecordEntity> workerOtWrapper = new LambdaQueryWrapper<>();
        workerOtWrapper.gt(WorkerAttendanceRecordEntity::getOvertimeHours, overtimeThreshold);
        List<WorkerAttendanceRecordEntity> overtimeWorkerRecords = workerRecordMapper.selectList(workerOtWrapper);
        for (WorkerAttendanceRecordEntity record : overtimeWorkerRecords) {
            if (record.getWorkerId() == null || record.getAttendanceDate() == null) continue;
            WorkerEntity worker = workerMapper.selectById(record.getWorkerId());
            String workerName = worker != null ? worker.getName() : "未知工人";
            String title = String.format("工人超长加班：%s", workerName);
            String description = String.format("工人 %s 在 %s 的加班时长为 %.1f 小时，超过 10 小时阈值。",
                    workerName, record.getAttendanceDate(), record.getOvertimeHours());
            createOrUpdateAnomaly(AnomalyTypeEnum.OVERTIME_TOO_LONG.getCode(),
                    AnomalySubTypeEnum.WORKER.getCode(),
                    record.getWorkerId(), title, description,
                    "/worker-records", record.getAttendanceDate());
            affected++;
        }

        // 6. 全局超长加班检测 - 司机
        LambdaQueryWrapper<DriverAttendanceRecordEntity> driverOtWrapper = new LambdaQueryWrapper<>();
        driverOtWrapper.gt(DriverAttendanceRecordEntity::getOvertimeHours, overtimeThreshold);
        List<DriverAttendanceRecordEntity> overtimeDriverRecords = driverRecordMapper.selectList(driverOtWrapper);
        for (DriverAttendanceRecordEntity record : overtimeDriverRecords) {
            if (record.getDriverId() == null || record.getAttendanceDate() == null) continue;
            DriverEntity driver = driverMapper.selectById(record.getDriverId());
            String driverName = driver != null ? driver.getRealName() : "未知司机";
            String title = String.format("司机超长加班：%s", driverName);
            String description = String.format("司机 %s 在 %s 的加班时长为 %.1f 小时，超过 10 小时阈值。",
                    driverName, record.getAttendanceDate(), record.getOvertimeHours());
            createOrUpdateAnomaly(AnomalyTypeEnum.OVERTIME_TOO_LONG.getCode(),
                    AnomalySubTypeEnum.DRIVER.getCode(),
                    record.getDriverId(), title, description,
                    "/driver-records", record.getAttendanceDate());
            affected++;
        }

        log.info("全局异常检测完成，受影响记录数: {}", affected);
        return affected;
    }

    // ==================== 私有辅助方法 ====================

    /**
     * 创建或更新异常记录（未处理状态）
     */
    private void createOrUpdateAnomaly(Integer type, Integer subType, Long relatedId,
                                       String title, String description, String linkUrl,
                                       LocalDate relatedDate) {
        // 查询是否已存在同类型同关联对象的未处理异常
        LambdaQueryWrapper<AnomalyRecordEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AnomalyRecordEntity::getType, type)
                .eq(AnomalyRecordEntity::getSubType, subType)
                .eq(AnomalyRecordEntity::getRelatedId, relatedId)
                .eq(AnomalyRecordEntity::getStatus, AnomalyStatusEnum.UNRESOLVED.getCode());
        if (relatedDate != null) {
            wrapper.eq(AnomalyRecordEntity::getRelatedDate, relatedDate);
        }
        AnomalyRecordEntity existing = anomalyRecordMapper.selectOne(wrapper);

        if (existing != null) {
            existing.setTitle(title);
            existing.setDescription(description);
            existing.setLinkUrl(linkUrl);
            existing.setRelatedDate(relatedDate);
            anomalyRecordMapper.updateById(existing);
            log.info("更新异常记录: anomalyId={}, type={}, relatedId={}", existing.getId(), type, relatedId);
        } else {
            AnomalyRecordEntity entity = new AnomalyRecordEntity();
            entity.setType(type);
            entity.setSubType(subType);
            entity.setStatus(AnomalyStatusEnum.UNRESOLVED.getCode());
            entity.setTitle(title);
            entity.setDescription(description);
            entity.setRelatedId(relatedId);
            entity.setLinkUrl(linkUrl);
            entity.setRelatedDate(relatedDate);
            anomalyRecordMapper.insert(entity);
            log.info("创建异常记录: type={}, subType={}, relatedId={}", type, subType, relatedId);
        }
    }

    /**
     * 关闭（删除）指定类型和关联对象的未处理异常
     */
    private void closeAnomaly(Integer type, Integer subType, Long relatedId) {
        if (relatedId == null) {
            return;
        }
        LambdaUpdateWrapper<AnomalyRecordEntity> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(AnomalyRecordEntity::getType, type)
                .eq(AnomalyRecordEntity::getSubType, subType)
                .eq(AnomalyRecordEntity::getRelatedId, relatedId)
                .eq(AnomalyRecordEntity::getStatus, AnomalyStatusEnum.UNRESOLVED.getCode());
        anomalyRecordMapper.delete(wrapper);
    }

    /**
     * 按关联对象和日期关闭未处理异常
     */
    private void closeAnomalyByRelated(Integer type, Integer subType, Long relatedId, LocalDate relatedDate) {
        if (relatedId == null) {
            return;
        }
        LambdaUpdateWrapper<AnomalyRecordEntity> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(AnomalyRecordEntity::getType, type)
                .eq(AnomalyRecordEntity::getSubType, subType)
                .eq(AnomalyRecordEntity::getRelatedId, relatedId)
                .eq(AnomalyRecordEntity::getRelatedDate, relatedDate)
                .eq(AnomalyRecordEntity::getStatus, AnomalyStatusEnum.UNRESOLVED.getCode());
        anomalyRecordMapper.delete(wrapper);
    }

    private AnomalyRecordVO convertToVO(AnomalyRecordEntity entity) {
        AnomalyRecordVO vo = new AnomalyRecordVO();
        vo.setId(entity.getId());
        vo.setType(entity.getType());
        vo.setTypeText(AnomalyTypeEnum.fromCode(entity.getType()) != null
                ? AnomalyTypeEnum.fromCode(entity.getType()).getDescription() : "未知");
        vo.setSubType(entity.getSubType());
        vo.setSubTypeText(AnomalySubTypeEnum.fromCode(entity.getSubType()) != null
                ? AnomalySubTypeEnum.fromCode(entity.getSubType()).getDescription() : "未知");
        vo.setStatus(entity.getStatus());
        vo.setStatusText(AnomalyStatusEnum.fromCode(entity.getStatus()) != null
                ? AnomalyStatusEnum.fromCode(entity.getStatus()).getDescription() : "未知");
        vo.setTitle(entity.getTitle());
        vo.setDescription(entity.getDescription());
        vo.setRelatedId(entity.getRelatedId());
        vo.setRelatedId2(entity.getRelatedId2());
        vo.setRelatedDate(entity.getRelatedDate());
        vo.setLinkUrl(entity.getLinkUrl());
        vo.setResolvedTime(entity.getResolvedTime());
        vo.setResolvedBy(entity.getResolvedBy());
        vo.setCreateTime(entity.getCreateTime());

        if (entity.getResolvedBy() != null) {
            AdminEntity admin = adminMapper.selectById(entity.getResolvedBy());
            vo.setResolvedByName(admin != null ? admin.getRealName() : "-");
        }
        return vo;
    }
}
