package com.green.module.driver.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.green.common.exception.BusinessException;
import com.green.common.result.ResultCodeEnum;
import com.green.module.driver.entity.DriverFavoriteWorkerEntity;
import com.green.module.driver.mapper.DriverFavoriteWorkerMapper;
import com.green.module.driver.service.DriverFavoriteWorkerService;
import com.green.module.worker.entity.WorkerEntity;
import com.green.module.worker.mapper.WorkerMapper;
import com.green.module.worker.vo.WorkerListVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.text.Collator;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 司机常用工人服务实现
 */
@Service
@RequiredArgsConstructor
public class DriverFavoriteWorkerServiceImpl implements DriverFavoriteWorkerService {

    private final DriverFavoriteWorkerMapper favoriteWorkerMapper;
    private final WorkerMapper workerMapper;

    @Override
    public List<WorkerListVO> listFavoriteWorkers(Long driverId) {
        LambdaQueryWrapper<DriverFavoriteWorkerEntity> fwWrapper = new LambdaQueryWrapper<>();
        fwWrapper.eq(DriverFavoriteWorkerEntity::getDriverId, driverId)
                .orderByDesc(DriverFavoriteWorkerEntity::getCreateTime);
        List<DriverFavoriteWorkerEntity> favorites = favoriteWorkerMapper.selectList(fwWrapper);

        if (favorites.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> workerIds = favorites.stream()
                .map(DriverFavoriteWorkerEntity::getWorkerId)
                .collect(Collectors.toSet());

        List<WorkerEntity> workers = workerMapper.selectBatchIds(workerIds);
        Collator collator = Collator.getInstance(Locale.CHINA);
        return workers.stream()
                .map(this::convertToVO)
                .sorted(Comparator.comparing(WorkerListVO::getName, collator))
                .collect(Collectors.toList());
    }

    @Override
    public void addFavoriteWorker(Long driverId, Long workerId) {
        // 检查工人是否存在且在职
        WorkerEntity worker = workerMapper.selectById(workerId);
        if (worker == null || worker.getIsEmployed() == 0) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "工人不存在或已离职");
        }

        // 检查是否已存在未删除记录
        LambdaQueryWrapper<DriverFavoriteWorkerEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DriverFavoriteWorkerEntity::getDriverId, driverId)
                .eq(DriverFavoriteWorkerEntity::getWorkerId, workerId);
        if (favoriteWorkerMapper.selectCount(wrapper) > 0) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "该工人已在常用列表中");
        }

        // 如果存在已逻辑删除的记录，则恢复，避免唯一索引冲突
        DriverFavoriteWorkerEntity deleted = favoriteWorkerMapper.selectDeletedByDriverAndWorker(driverId, workerId);
        if (deleted != null) {
            favoriteWorkerMapper.restoreByDriverAndWorker(driverId, workerId);
            return;
        }

        DriverFavoriteWorkerEntity entity = new DriverFavoriteWorkerEntity();
        entity.setDriverId(driverId);
        entity.setWorkerId(workerId);
        favoriteWorkerMapper.insert(entity);
    }

    @Override
    public void removeFavoriteWorker(Long driverId, Long workerId) {
        LambdaQueryWrapper<DriverFavoriteWorkerEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DriverFavoriteWorkerEntity::getDriverId, driverId)
                .eq(DriverFavoriteWorkerEntity::getWorkerId, workerId);
        favoriteWorkerMapper.delete(wrapper);
    }

    @Override
    public List<WorkerListVO> searchAvailableWorkers(Long driverId, String keyword) {
        // 获取已在常用列表的工人ID
        LambdaQueryWrapper<DriverFavoriteWorkerEntity> fwWrapper = new LambdaQueryWrapper<>();
        fwWrapper.eq(DriverFavoriteWorkerEntity::getDriverId, driverId);
        Set<Long> existingIds = favoriteWorkerMapper.selectList(fwWrapper).stream()
                .map(DriverFavoriteWorkerEntity::getWorkerId)
                .collect(Collectors.toSet());

        // 搜索在职工人
        LambdaQueryWrapper<WorkerEntity> wWrapper = new LambdaQueryWrapper<>();
        wWrapper.eq(WorkerEntity::getIsEmployed, 1);
        if (StringUtils.hasText(keyword)) {
            wWrapper.and(w -> w.like(WorkerEntity::getName, keyword)
                    .or()
                    .like(WorkerEntity::getPhone, keyword));
        }
        List<WorkerEntity> workers = workerMapper.selectList(wWrapper);
        Collator collator = Collator.getInstance(Locale.CHINA);
        return workers.stream()
                .filter(w -> !existingIds.contains(w.getId()))
                .map(this::convertToVO)
                .sorted(Comparator.comparing(WorkerListVO::getName, collator))
                .collect(Collectors.toList());
    }

    private WorkerListVO convertToVO(WorkerEntity worker) {
        WorkerListVO vo = new WorkerListVO();
        vo.setId(worker.getId());
        vo.setName(worker.getName());
        vo.setPhone(worker.getPhone());
        vo.setBaseDailySalary(worker.getBaseDailySalary());
        vo.setOvertimeHourlyRate(worker.getOvertimeHourlyRate());
        vo.setIsEmployed(worker.getIsEmployed());
        return vo;
    }
}
