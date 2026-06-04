package com.green.module.project.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.green.module.project.entity.ProjectEntity;

import java.util.List;

/**
 * 项目服务接口
 */
public interface ProjectService {

    IPage<ProjectEntity> list(int pageNum, int pageSize, String keyword);

    ProjectEntity detail(Long id);

    Long create(ProjectEntity entity);

    void update(ProjectEntity entity);

    void delete(Long id);

    List<ProjectEntity> listAllActive();
}
