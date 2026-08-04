package com.green.module.expense.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.green.module.expense.entity.ExpenseItemCommonSubjectEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 开支项目常用主体数据访问层
 */
@Mapper
public interface ExpenseItemCommonSubjectMapper extends BaseMapper<ExpenseItemCommonSubjectEntity> {
}
