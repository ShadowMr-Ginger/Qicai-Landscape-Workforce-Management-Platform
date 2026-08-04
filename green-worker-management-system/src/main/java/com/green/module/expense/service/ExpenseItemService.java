package com.green.module.expense.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.green.module.expense.dto.ExpenseItemDTO;
import com.green.module.expense.vo.ExpenseItemVO;

import java.util.List;

/**
 * 开支项目服务接口
 */
public interface ExpenseItemService {

    /**
     * 分页查询开支项目列表
     */
    Page<ExpenseItemVO> pageList(String keyword, Integer pageNum, Integer pageSize);

    /**
     * 查询全部开支项目（用于下拉选择）
     */
    List<ExpenseItemVO> listAll();

    /**
     * 开支项目详情
     */
    ExpenseItemVO detail(Long id);

    /**
     * 新增开支项目
     */
    Long create(ExpenseItemDTO dto);

    /**
     * 修改开支项目
     */
    void update(Long id, ExpenseItemDTO dto);

    /**
     * 删除开支项目
     */
    void delete(Long id);

    /**
     * 获取常用主体列表
     */
    List<ExpenseItemVO.CommonSubjectVO> listCommonSubjects(Long expenseItemId);

    /**
     * 新增常用主体
     */
    Long createCommonSubject(Long expenseItemId, ExpenseItemDTO.CommonSubjectDTO dto);

    /**
     * 修改常用主体
     */
    void updateCommonSubject(Long id, ExpenseItemDTO.CommonSubjectDTO dto);

    /**
     * 删除常用主体
     */
    void deleteCommonSubject(Long id);

    /**
     * 获取常用备注列表
     */
    List<ExpenseItemVO.CommonRemarkVO> listCommonRemarks(Long expenseItemId);

    /**
     * 新增常用备注
     */
    Long createCommonRemark(Long expenseItemId, ExpenseItemDTO.CommonRemarkDTO dto);

    /**
     * 修改常用备注
     */
    void updateCommonRemark(Long id, ExpenseItemDTO.CommonRemarkDTO dto);

    /**
     * 删除常用备注
     */
    void deleteCommonRemark(Long id);
}
