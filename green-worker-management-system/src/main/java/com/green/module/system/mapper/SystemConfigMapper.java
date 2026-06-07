package com.green.module.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.green.module.system.entity.SystemConfigEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 系统配置Mapper
 */
@Mapper
public interface SystemConfigMapper extends BaseMapper<SystemConfigEntity> {
}
