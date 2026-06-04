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
import com.green.module.worker.dto.UpdateWorkerDTO;
import com.green.module.worker.dto.WorkerQuery;
import com.green.module.worker.entity.WorkerEntity;
import com.green.module.worker.mapper.WorkerMapper;
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

        BeanUtils.copyProperties(dto, entity);
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
    @Transactional(rollbackFor = Exception.class)
    public int deleteWorker(Long id) {
        WorkerEntity entity = workerMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "工人不存在");
        }

        // 1. 查询关联的考勤记录数量
        Long attendanceCount = workerAttendanceRecordMapper.selectCount(
                new LambdaQueryWrapper<>()
                        .eq(com.green.module.attendance.entity.WorkerAttendanceRecordEntity::getWorkerId, id)
        );

        // 2. 删除关联的考勤记录
        if (attendanceCount > 0) {
            workerAttendanceRecordMapper.delete(
                    new LambdaQueryWrapper<>()
                            .eq(com.green.module.attendance.entity.WorkerAttendanceRecordEntity::getWorkerId, id)
            );
            log.info("删除工人关联考勤记录: workerId={}, count={}", id, attendanceCount);
        }

        // 3. 删除工人
        workerMapper.deleteById(id);
        log.info("删除工人成功: workerId={}", id);

        return attendanceCount.intValue();
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

        // 查询组别名称
        if (entity.getGroupId() != null) {
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

        // 查询组别名称
        if (entity.getGroupId() != null) {
            GroupEntity group = groupMapper.selectById(entity.getGroupId());
            vo.setGroupName(group != null ? group.getGroupName() : "-");
        } else {
            vo.setGroupName("-");
        }

        // 查询默认项目名称
        if (entity.getDefaultProjectId() != null) {
            ProjectEntity project = projectMapper.selectById(entity.getDefaultProjectId());
            vo.setDefaultProjectName(project != null ? project.getProjectName() : "-");
        } else {
            vo.setDefaultProjectName("-");
        }

        return vo;
    }
}
