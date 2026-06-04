package com.green.module.log.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.green.module.log.entity.LogEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 操作日志数据访问层
 *
 * @author Green Team
 * @version 1.0.0
 */
@Mapper
public interface LogMapper extends BaseMapper<LogEntity> {
}
