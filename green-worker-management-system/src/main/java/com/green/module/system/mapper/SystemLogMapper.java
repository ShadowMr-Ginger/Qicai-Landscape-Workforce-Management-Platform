package com.green.module.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.green.module.system.entity.SystemLogEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 系统日志Mapper
 */
@Mapper
public interface SystemLogMapper extends BaseMapper<SystemLogEntity> {
}
