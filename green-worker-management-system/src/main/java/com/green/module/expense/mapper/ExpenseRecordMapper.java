package com.green.module.expense.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.green.module.expense.entity.ExpenseRecordEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 开销记录主表数据访问层
 */
@Mapper
public interface ExpenseRecordMapper extends BaseMapper<ExpenseRecordEntity> {

    /**
     * 按项目和日期汇总开销
     */
    @Select("SELECT record_date as recordDate, COALESCE(SUM(total_amount), 0) as totalAmount " +
            "FROM expense_records " +
            "WHERE deleted = 0 AND project_id = #{projectId} " +
            "AND record_date BETWEEN #{startDate} AND #{endDate} " +
            "GROUP BY record_date")
    List<Map<String, Object>> sumAmountByProjectAndDateRange(@Param("projectId") Long projectId,
                                                             @Param("startDate") LocalDate startDate,
                                                             @Param("endDate") LocalDate endDate);

    /**
     * 按日期汇总开销（全部项目）
     */
    @Select("SELECT record_date as recordDate, COALESCE(SUM(total_amount), 0) as totalAmount " +
            "FROM expense_records " +
            "WHERE deleted = 0 " +
            "AND record_date BETWEEN #{startDate} AND #{endDate} " +
            "GROUP BY record_date")
    List<Map<String, Object>> sumAmountByDateRange(@Param("startDate") LocalDate startDate,
                                                   @Param("endDate") LocalDate endDate);

    /**
     * 统计指定项目指定日期的总开销
     */
    @Select("SELECT COALESCE(SUM(total_amount), 0) FROM expense_records " +
            "WHERE deleted = 0 AND project_id = #{projectId} AND record_date = #{recordDate}")
    BigDecimal sumAmountByProjectAndDate(@Param("projectId") Long projectId,
                                         @Param("recordDate") LocalDate recordDate);

    /**
     * 统计指定日期全部项目总开销
     */
    @Select("SELECT COALESCE(SUM(total_amount), 0) FROM expense_records " +
            "WHERE deleted = 0 AND record_date = #{recordDate}")
    BigDecimal sumAmountByDate(@Param("recordDate") LocalDate recordDate);

    /**
     * 统计指定开支项目的总开销
     */
    @Select("SELECT COALESCE(SUM(total_amount), 0) FROM expense_records " +
            "WHERE deleted = 0 AND expense_item_id = #{expenseItemId}")
    BigDecimal sumAmountByExpenseItem(@Param("expenseItemId") Long expenseItemId);
}
