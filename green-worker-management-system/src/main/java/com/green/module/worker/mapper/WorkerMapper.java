package com.green.module.worker.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.green.module.worker.entity.WorkerEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 工人数据访问层
 *
 * @author Green Team
 * @version 1.0.0
 */
@Mapper
public interface WorkerMapper extends BaseMapper<WorkerEntity> {
}
