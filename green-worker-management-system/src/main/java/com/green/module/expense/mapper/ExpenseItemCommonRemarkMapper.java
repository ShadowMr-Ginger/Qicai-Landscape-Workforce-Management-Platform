package com.green.module.expense.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.green.module.expense.entity.ExpenseItemCommonRemarkEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 开支项目常用备注数据访问层
 */
@Mapper
public interface ExpenseItemCommonRemarkMapper extends BaseMapper<ExpenseItemCommonRemarkEntity> {
}
