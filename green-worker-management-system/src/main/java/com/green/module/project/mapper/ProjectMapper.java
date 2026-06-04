package com.green.module.project.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.green.module.project.entity.ProjectEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 项目数据访问层
 *
 * @author Green Team
 * @version 1.0.0
 */
@Mapper
public interface ProjectMapper extends BaseMapper<ProjectEntity> {
}
