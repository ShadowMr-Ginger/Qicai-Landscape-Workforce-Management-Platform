package com.green.module.expense.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.green.module.expense.entity.ExpenseItemEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 开支项目数据访问层
 */
@Mapper
public interface ExpenseItemMapper extends BaseMapper<ExpenseItemEntity> {
}
