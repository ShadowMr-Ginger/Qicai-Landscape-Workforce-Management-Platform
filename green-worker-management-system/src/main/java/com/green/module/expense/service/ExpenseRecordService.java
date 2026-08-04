package com.green.module.expense.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.green.module.expense.dto.ExpenseRecordDTO;
import com.green.module.expense.vo.ExpenseRecordVO;

import java.time.LocalDate;
import java.util.List;

/**
 * 开销记录服务接口
 */
public interface ExpenseRecordService {

    /**
     * 分页查询开销记录
     */
    Page<ExpenseRecordVO> pageList(Long projectId, Long expenseItemId,
                                   LocalDate startDate, LocalDate endDate,
                                   Integer pageNum, Integer pageSize);

    /**
     * 开销记录详情
     */
    ExpenseRecordVO detail(Long id);

    /**
     * 新增开销记录
     */
    Long create(ExpenseRecordDTO dto);

    /**
     * 修改开销记录
     */
    void update(Long id, ExpenseRecordDTO dto);

    /**
     * 删除开销记录
     */
    void delete(Long id);

    /**
     * 按项目+日期范围汇总开销金额
     */
    java.util.Map<LocalDate, java.math.BigDecimal> sumAmountByProjectAndDateRange(Long projectId,
                                                                                  LocalDate startDate,
                                                                                  LocalDate endDate);

    /**
     * 按日期范围汇总全部开销金额
     */
    java.util.Map<LocalDate, java.math.BigDecimal> sumAmountByDateRange(LocalDate startDate,
                                                                        LocalDate endDate);

    /**
     * 指定项目指定日期的总开销
     */
    java.math.BigDecimal sumAmountByProjectAndDate(Long projectId, LocalDate recordDate);

    /**
     * 指定日期全部项目总开销
     */
    java.math.BigDecimal sumAmountByDate(LocalDate recordDate);
}
