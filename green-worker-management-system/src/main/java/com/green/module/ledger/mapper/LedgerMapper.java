package com.green.module.ledger.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.green.module.ledger.entity.LedgerEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 记录台账主表数据访问层
 */
@Mapper
public interface LedgerMapper extends BaseMapper<LedgerEntity> {
}
