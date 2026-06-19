package com.green.module.worker.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.green.common.exception.BusinessException;
import com.green.common.result.ResultCodeEnum;
import com.green.module.attendance.mapper.WorkerAttendanceRecordMapper;
import com.green.module.group.entity.GroupEntity;
import com.green.module.group.mapper.GroupMapper;
import com.green.module.project.entity.ProjectEntity;
import com.green.module.project.mapper.ProjectMapper;
import com.green.module.worker.dto.CreateWorkerDTO;
import com.green.module.worker.dto.UpdateWorkerDTO;
import com.green.module.worker.dto.WorkerQuery;
import com.green.module.worker.entity.WorkerEntity;
import com.green.module.worker.mapper.WorkerMapper;
import com.green.module.anomaly.service.AnomalyRecordService;
import com.green.module.worker.service.WorkerService;
import com.green.module.worker.vo.WorkerDetailVO;
import com.green.module.worker.vo.WorkerListVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 工人服务实现
 *
 * @author Green Team
 * @version 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WorkerServiceImpl implements WorkerService {

    private final WorkerMapper workerMapper;
    private final GroupMapper groupMapper;
    private final ProjectMapper projectMapper;
    private final WorkerAttendanceRecordMapper workerAttendanceRecordMapper;
    private final AnomalyRecordService anomalyRecordService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long create(CreateWorkerDTO dto) {
        // 工人姓名唯一：避免同名覆盖
        checkNameUnique(null, dto.getName());

        WorkerEntity entity = new WorkerEntity();
        entity.setName(dto.getName());
        entity.setGender(dto.getGender());
        entity.setGroupId(dto.getGroupId());
        entity.setPhone(blankToNull(dto.getPhone()));
        entity.setIdCard(blankToNull(dto.getIdCard()));
        entity.setBaseDailySalary(dto.getBaseDailySalary());
        entity.setOvertimeHourlyRate(dto.getOvertimeHourlyRate());
        entity.setEmergencyContactPhone(blankToNull(dto.getEmergencyContactPhone()));
        entity.setIsSkilledWorker(dto.getIsSkilledWorker());
        entity.setDefaultProjectId(dto.getDefaultProjectId());
        // 新增工人一定是在职的
        entity.setIsEmployed(1);
        entity.setCreatedByType(1);
        workerMapper.insert(entity);
        log.info("新增工人成功: workerId={}, name={}", entity.getId(), entity.getName());
        return entity.getId();
    }

    @Override
    public IPage<WorkerListVO> list(WorkerQuery query) {
        // 构建分页对象
        Page<WorkerEntity> page = new Page<>(query.getPageNum(), query.getPageSize());

        // 构建查询条件
        LambdaQueryWrapper<WorkerEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(WorkerEntity::getIsEmployed, query.getIsEmployed());

        if (StringUtils.hasText(query.getKeyword())) {
            wrapper.like(WorkerEntity::getName, query.getKeyword());
        }
        if (query.getGender() != null) {
            wrapper.eq(WorkerEntity::getGender, query.getGender());
        }
        if (query.getIsSkilledWorker() != null) {
            wrapper.eq(WorkerEntity::getIsSkilledWorker, query.getIsSkilledWorker());
        }
        if (query.getGroupId() != null) {
            wrapper.eq(WorkerEntity::getGroupId, query.getGroupId());
        }

        // 按创建时间倒序
        wrapper.orderByDesc(WorkerEntity::getCreateTime);

        IPage<WorkerEntity> entityPage = workerMapper.selectPage(page, wrapper);

        // 转换为 VO
        List<WorkerListVO> voList = entityPage.getRecords().stream()
                .map(this::convertToListVO)
                .collect(Collectors.toList());

        Page<WorkerListVO> resultPage = new Page<>(entityPage.getCurrent(), entityPage.getSize(), entityPage.getTotal());
        resultPage.setRecords(voList);
        return resultPage;
    }

    @Override
    public WorkerDetailVO detail(Long id) {
        WorkerEntity entity = workerMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "工人不存在");
        }
        return convertToDetailVO(entity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(Long id, UpdateWorkerDTO dto) {
        WorkerEntity entity = workerMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "工人不存在");
        }
        // 工人姓名唯一：如果修改了姓名，需要校验
        if (!dto.getName().equals(entity.getName())) {
            checkNameUnique(id, dto.getName());
        }

        BeanUtils.copyProperties(dto, entity);
        entity.setPhone(blankToNull(entity.getPhone()));
        entity.setIdCard(blankToNull(entity.getIdCard()));
        entity.setEmergencyContactPhone(blankToNull(entity.getEmergencyContactPhone()));
        workerMapper.updateById(entity);
        log.info("修改工人信息成功: workerId={}", id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void resign(Long id) {
        WorkerEntity entity = workerMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "工人不存在");
        }
        if (entity.getIsEmployed() != null && entity.getIsEmployed() == 0) {
            throw new BusinessException(ResultCodeEnum.BUSINESS_ERROR, "该工人已离职");
        }

        entity.setIsEmployed(0);
        workerMapper.updateById(entity);
        log.info("工人离职成功: workerId={}", id);
    }

    @Override
    public int countWorkerAttendance(Long id) {
        LambdaQueryWrapper<com.green.module.attendance.entity.WorkerAttendanceRecordEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(com.green.module.attendance.entity.WorkerAttendanceRecordEntity::getWorkerId, id);
        wrapper.eq(com.green.module.attendance.entity.WorkerAttendanceRecordEntity::getDeleted, 0);
        return workerAttendanceRecordMapper.selectCount(wrapper).intValue();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int deleteWorker(Long id) {
        WorkerEntity entity = workerMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "工人不存在");
        }

        // 统计并逻辑删除关联的未删除考勤记录
        int attendanceCount = countWorkerAttendance(id);
        if (attendanceCount > 0) {
            LambdaQueryWrapper<com.green.module.attendance.entity.WorkerAttendanceRecordEntity> deleteWrapper = new LambdaQueryWrapper<>();
            deleteWrapper.eq(com.green.module.attendance.entity.WorkerAttendanceRecordEntity::getWorkerId, id);
            deleteWrapper.eq(com.green.module.attendance.entity.WorkerAttendanceRecordEntity::getDeleted, 0);
            workerAttendanceRecordMapper.delete(deleteWrapper);
            log.info("删除工人关联考勤记录: workerId={}, count={}", id, attendanceCount);
        }

        // 将被删除工人姓名加上标记，释放唯一索引，便于后续添加同名工人
        WorkerEntity update = new WorkerEntity();
        update.setId(id);
        update.setName(generateDeletedName(entity.getName(), id));
        update.setDeleted(1);
        workerMapper.updateById(update);
        log.info("删除工人成功: workerId={}", id);

        return attendanceCount;
    }

    /**
     * 生成删除后的唯一名称，避免占用唯一索引
     */
    private String generateDeletedName(String originalName, Long id) {
        String suffix = "_deleted_" + id;
        int maxLen = 50 - suffix.length();
        String prefix = originalName == null ? "" : originalName;
        if (prefix.length() > maxLen) {
            prefix = prefix.substring(0, maxLen);
        }
        return prefix + suffix;
    }

    /**
     * 将空白字符串转为 null
     */
    private String blankToNull(String value) {
        return StringUtils.hasText(value) ? value : null;
    }

    /**
     * 校验工人姓名唯一性
     */
    private void checkNameUnique(Long currentId, String name) {
        LambdaQueryWrapper<WorkerEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(WorkerEntity::getName, name)
                .eq(WorkerEntity::getDeleted, 0)
                .ne(currentId != null, WorkerEntity::getId, currentId);
        if (workerMapper.selectCount(wrapper) > 0) {
            throw new BusinessException(ResultCodeEnum.DATA_ALREADY_EXISTS,
                    "已存在同名工人，如需添加，请修改工人名字或删除同名工人");
        }
    }

    /**
     * 转换为列表 VO
     */
    private WorkerListVO convertToListVO(WorkerEntity entity) {
        WorkerListVO vo = new WorkerListVO();
        vo.setId(entity.getId());
        vo.setName(entity.getName());
        vo.setGenderText(entity.getGender() != null && entity.getGender() == 1 ? "男" : "女");
        vo.setIsSkilledWorkerText(entity.getIsSkilledWorker() != null && entity.getIsSkilledWorker() == 1 ? "是" : "否");
        vo.setPhone(entity.getPhone());
        vo.setBaseDailySalary(entity.getBaseDailySalary());
        vo.setOvertimeHourlyRate(entity.getOvertimeHourlyRate());
        vo.setIsEmployed(entity.getIsEmployed());

        // 查询组别
        if (entity.getGroupId() != null) {
            vo.setGroupId(entity.getGroupId());
            GroupEntity group = groupMapper.selectById(entity.getGroupId());
            vo.setGroupName(group != null ? group.getGroupName() : "-");
        } else {
            vo.setGroupName("-");
        }

        return vo;
    }

    /**
     * 转换为详情 VO
     */
    private WorkerDetailVO convertToDetailVO(WorkerEntity entity) {
        WorkerDetailVO vo = new WorkerDetailVO();
        vo.setId(entity.getId());
        vo.setName(entity.getName());
        vo.setGenderText(entity.getGender() != null && entity.getGender() == 1 ? "男" : "女");
        vo.setPhone(entity.getPhone());
        vo.setIdCard(entity.getIdCard());
        vo.setBaseDailySalary(entity.getBaseDailySalary());
        vo.setOvertimeHourlyRate(entity.getOvertimeHourlyRate());
        vo.setEmergencyContactPhone(entity.getEmergencyContactPhone());
        vo.setIsSkilledWorkerText(entity.getIsSkilledWorker() != null && entity.getIsSkilledWorker() == 1 ? "是" : "否");
        vo.setIsEmployedText(entity.getIsEmployed() != null && entity.getIsEmployed() == 1 ? "在职" : "离职");
        vo.setCreateTime(entity.getCreateTime());

        // 查询组别
        if (entity.getGroupId() != null) {
            vo.setGroupId(entity.getGroupId());
            GroupEntity group = groupMapper.selectById(entity.getGroupId());
            vo.setGroupName(group != null ? group.getGroupName() : "-");
        } else {
            vo.setGroupName("-");
        }

        return vo;
    }
}
