package com.green.module.expense.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.green.module.expense.entity.ExpenseRecordItemEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 开销记录明细数据访问层
 */
@Mapper
public interface ExpenseRecordItemMapper extends BaseMapper<ExpenseRecordItemEntity> {
}
