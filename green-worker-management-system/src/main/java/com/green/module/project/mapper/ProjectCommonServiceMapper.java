package com.green.module.project.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.green.module.project.entity.ProjectCommonServiceEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 项目内常用服务数据访问层
 */
@Mapper
public interface ProjectCommonServiceMapper extends BaseMapper<ProjectCommonServiceEntity> {
}
