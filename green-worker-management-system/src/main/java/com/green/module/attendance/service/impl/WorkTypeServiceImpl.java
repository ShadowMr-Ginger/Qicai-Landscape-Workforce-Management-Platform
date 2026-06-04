package com.green.module.attendance.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.green.common.exception.BusinessException;
import com.green.common.result.ResultCodeEnum;
import com.green.module.attendance.entity.WorkTypeEntity;
import com.green.module.attendance.mapper.WorkTypeMapper;
import com.green.module.attendance.mapper.WorkerAttendanceRecordMapper;
import com.green.module.attendance.mapper.DriverAttendanceRecordMapper;
import com.green.module.attendance.service.WorkTypeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 作业类型服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WorkTypeServiceImpl implements WorkTypeService {

    private final WorkTypeMapper workTypeMapper;
    private final WorkerAttendanceRecordMapper workerRecordMapper;
    private final DriverAttendanceRecordMapper driverRecordMapper;

    @Override
    public List<WorkTypeEntity> listAll() {
        LambdaQueryWrapper<WorkTypeEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByAsc(WorkTypeEntity::getSortOrder);
        return workTypeMapper.selectList(wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long create(String typeName, String description) {
        WorkTypeEntity entity = new WorkTypeEntity();
        entity.setTypeName(typeName);
        entity.setDescription(description);
        entity.setIsActive(1);
        entity.setIsSystem(0);
        entity.setSortOrder(0);
        workTypeMapper.insert(entity);
        log.info("新增作业类型: id={}, name={}", entity.getId(), typeName);
        return entity.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(Long id, String typeName, String description) {
        WorkTypeEntity entity = workTypeMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "作业类型不存在");
        }
        entity.setTypeName(typeName);
        entity.setDescription(description);
        workTypeMapper.updateById(entity);
        log.info("修改作业类型: id={}", id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        WorkTypeEntity entity = workTypeMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "作业类型不存在");
        }
        if (entity.getIsSystem() != null && entity.getIsSystem() == 1) {
            throw new BusinessException(ResultCodeEnum.BUSINESS_ERROR, "系统预设作业类型不可删除");
        }

        // 查询默认作业类型ID
        LambdaQueryWrapper<WorkTypeEntity> defaultWrapper = new LambdaQueryWrapper<>();
        defaultWrapper.eq(WorkTypeEntity::getIsSystem, 1);
        WorkTypeEntity defaultType = workTypeMapper.selectOne(defaultWrapper);
        Long defaultId = defaultType != null ? defaultType.getId() : null;

        if (defaultId != null) {
            // 将关联的工人考勤记录作业类型改为默认
            LambdaUpdateWrapper<com.green.module.attendance.entity.WorkerAttendanceRecordEntity> wUpdate = new LambdaUpdateWrapper<>();
            wUpdate.eq(com.green.module.attendance.entity.WorkerAttendanceRecordEntity::getWorkTypeId, id);
            wUpdate.set(com.green.module.attendance.entity.WorkerAttendanceRecordEntity::getWorkTypeId, defaultId);
            workerRecordMapper.update(wUpdate);

            // 将关联的司机考勤记录作业类型改为默认
            LambdaUpdateWrapper<com.green.module.attendance.entity.DriverAttendanceRecordEntity> dUpdate = new LambdaUpdateWrapper<>();
            dUpdate.eq(com.green.module.attendance.entity.DriverAttendanceRecordEntity::getWorkTypeId, id);
            dUpdate.set(com.green.module.attendance.entity.DriverAttendanceRecordEntity::getWorkTypeId, defaultId);
            driverRecordMapper.update(dUpdate);
        }

        workTypeMapper.deleteById(id);
        log.info("删除作业类型: id={}, 关联记录已迁移到默认类型", id);
    }
}
