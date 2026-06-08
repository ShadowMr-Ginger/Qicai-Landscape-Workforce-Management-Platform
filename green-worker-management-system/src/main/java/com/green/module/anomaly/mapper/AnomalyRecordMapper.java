package com.green.module.anomaly.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.green.module.anomaly.entity.AnomalyRecordEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 异常记录 Mapper
 */
@Mapper
public interface AnomalyRecordMapper extends BaseMapper<AnomalyRecordEntity> {
}
