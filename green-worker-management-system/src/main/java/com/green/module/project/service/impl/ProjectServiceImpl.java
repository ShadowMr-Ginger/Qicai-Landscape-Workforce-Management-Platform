package com.green.module.project.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.green.common.exception.BusinessException;
import com.green.common.result.ResultCodeEnum;
import com.green.module.project.entity.ProjectEntity;
import com.green.module.project.mapper.ProjectMapper;
import com.green.module.project.service.ProjectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * 项目服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

    private final ProjectMapper projectMapper;

    @Override
    public IPage<ProjectEntity> list(int pageNum, int pageSize, String keyword) {
        Page<ProjectEntity> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<ProjectEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(ProjectEntity::getCreateTime);
        if (StringUtils.hasText(keyword)) {
            wrapper.like(ProjectEntity::getProjectName, keyword);
        }
        return projectMapper.selectPage(page, wrapper);
    }

    @Override
    public ProjectEntity detail(Long id) {
        ProjectEntity entity = projectMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "项目不存在");
        }
        return entity;
    }

    @Override
    public Long create(ProjectEntity entity) {
        entity.setStatus(1);
        projectMapper.insert(entity);
        log.info("新增项目: id={}, name={}", entity.getId(), entity.getProjectName());
        return entity.getId();
    }

    @Override
    public void update(ProjectEntity entity) {
        ProjectEntity existing = projectMapper.selectById(entity.getId());
        if (existing == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "项目不存在");
        }
        projectMapper.updateById(entity);
        log.info("修改项目: id={}", entity.getId());
    }

    @Override
    public void delete(Long id) {
        ProjectEntity existing = projectMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "项目不存在");
        }
        projectMapper.deleteById(id);
        log.info("删除项目: id={}", id);
    }

    @Override
    public List<ProjectEntity> listAllActive() {
        LambdaQueryWrapper<ProjectEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ProjectEntity::getStatus, 1);
        wrapper.orderByDesc(ProjectEntity::getCreateTime);
        return projectMapper.selectList(wrapper);
    }
}
