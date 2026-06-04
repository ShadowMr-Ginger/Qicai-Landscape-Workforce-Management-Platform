package com.green.module.group.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.green.common.exception.BusinessException;
import com.green.common.result.ResultCodeEnum;
import com.green.module.group.dto.CreateGroupDTO;
import com.green.module.group.dto.UpdateGroupDTO;
import com.green.module.group.entity.GroupEntity;
import com.green.module.group.mapper.GroupMapper;
import com.green.module.group.service.GroupService;
import com.green.module.group.vo.GroupListVO;
import com.green.module.group.vo.GroupWorkerVO;
import com.green.module.worker.entity.WorkerEntity;
import com.green.module.worker.mapper.WorkerMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 组别服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GroupServiceImpl implements GroupService {

    private final GroupMapper groupMapper;
    private final WorkerMapper workerMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long create(CreateGroupDTO dto) {
        GroupEntity entity = new GroupEntity();
        entity.setGroupName(dto.getGroupName());
        entity.setDescription(dto.getDescription());
        entity.setIsSystem(0);
        groupMapper.insert(entity);
        log.info("新增组别成功: groupId={}, name={}", entity.getId(), entity.getGroupName());
        return entity.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(Long id, UpdateGroupDTO dto) {
        GroupEntity entity = groupMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "组别不存在");
        }
        entity.setGroupName(dto.getGroupName());
        entity.setDescription(dto.getDescription());
        groupMapper.updateById(entity);
        log.info("修改组别成功: groupId={}", id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteGroup(Long id, Long targetGroupId) {
        GroupEntity entity = groupMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "组别不存在");
        }
        if (entity.getIsSystem() != null && entity.getIsSystem() == 1) {
            throw new BusinessException(ResultCodeEnum.BUSINESS_ERROR, "系统预设组别不可删除");
        }

        // 验证目标组别存在
        GroupEntity target = groupMapper.selectById(targetGroupId);
        if (target == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "目标组别不存在");
        }

        // 将该组所有工人迁移到目标组
        LambdaUpdateWrapper<WorkerEntity> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(WorkerEntity::getGroupId, id);
        updateWrapper.set(WorkerEntity::getGroupId, targetGroupId);
        workerMapper.update(updateWrapper);

        // 删除组别
        groupMapper.deleteById(id);
        log.info("删除组别成功: groupId={}, 工人迁移到 targetGroupId={}", id, targetGroupId);
    }

    @Override
    public List<GroupListVO> listAll() {
        List<GroupEntity> groups = groupMapper.selectList(null);
        return groups.stream().map(this::convertToListVO).collect(Collectors.toList());
    }

    @Override
    public GroupListVO detail(Long id) {
        GroupEntity entity = groupMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "组别不存在");
        }
        return convertToListVO(entity);
    }

    @Override
    public List<GroupWorkerVO> listWorkers(Long groupId) {
        LambdaQueryWrapper<WorkerEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(WorkerEntity::getGroupId, groupId);
        wrapper.orderByAsc(WorkerEntity::getIsEmployed);
        wrapper.orderByDesc(WorkerEntity::getCreateTime);
        List<WorkerEntity> workers = workerMapper.selectList(wrapper);
        return workers.stream().map(this::convertToWorkerVO).collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int resignAll(Long groupId) {
        LambdaUpdateWrapper<WorkerEntity> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(WorkerEntity::getGroupId, groupId);
        wrapper.eq(WorkerEntity::getIsEmployed, 1);
        wrapper.set(WorkerEntity::getIsEmployed, 0);
        int count = workerMapper.update(wrapper);
        log.info("组别全组离职: groupId={}, count={}", groupId, count);
        return count;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int restoreAll(Long groupId) {
        LambdaUpdateWrapper<WorkerEntity> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(WorkerEntity::getGroupId, groupId);
        wrapper.eq(WorkerEntity::getIsEmployed, 0);
        wrapper.set(WorkerEntity::getIsEmployed, 1);
        int count = workerMapper.update(wrapper);
        log.info("组别全组恢复: groupId={}, count={}", groupId, count);
        return count;
    }

    private GroupListVO convertToListVO(GroupEntity entity) {
        GroupListVO vo = new GroupListVO();
        vo.setId(entity.getId());
        vo.setGroupName(entity.getGroupName());
        vo.setDescription(entity.getDescription());
        vo.setIsSystem(entity.getIsSystem());

        // 统计组内工人数
        LambdaQueryWrapper<WorkerEntity> employedWrapper = new LambdaQueryWrapper<>();
        employedWrapper.eq(WorkerEntity::getGroupId, entity.getId());
        vo.setWorkerCount(workerMapper.selectCount(employedWrapper).intValue());

        // 统计离职工人数
        LambdaQueryWrapper<WorkerEntity> resignedWrapper = new LambdaQueryWrapper<>();
        resignedWrapper.eq(WorkerEntity::getGroupId, entity.getId());
        resignedWrapper.eq(WorkerEntity::getIsEmployed, 0);
        vo.setResignedWorkerCount(workerMapper.selectCount(resignedWrapper).intValue());

        return vo;
    }

    private GroupWorkerVO convertToWorkerVO(WorkerEntity entity) {
        GroupWorkerVO vo = new GroupWorkerVO();
        vo.setId(entity.getId());
        vo.setName(entity.getName());
        vo.setGender(entity.getGender());
        vo.setGenderText(entity.getGender() != null && entity.getGender() == 1 ? "男" : "女");
        vo.setPhone(entity.getPhone());
        vo.setBaseDailySalary(entity.getBaseDailySalary());
        vo.setOvertimeHourlyRate(entity.getOvertimeHourlyRate());
        vo.setIsEmployed(entity.getIsEmployed());
        vo.setIsEmployedText(entity.getIsEmployed() != null && entity.getIsEmployed() == 1 ? "在职" : "离职");
        return vo;
    }
}
