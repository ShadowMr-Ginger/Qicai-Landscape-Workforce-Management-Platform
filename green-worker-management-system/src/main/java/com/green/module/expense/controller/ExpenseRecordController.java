package com.green.module.expense.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.green.common.result.ApiResult;
import com.green.module.expense.dto.ExpenseRecordDTO;
import com.green.module.expense.service.ExpenseRecordService;
import com.green.module.expense.vo.ExpenseRecordVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * 开销记录管理接口
 */
@RestController
@RequestMapping("/api/admin/expense-records")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ExpenseRecordController {

    private final ExpenseRecordService expenseRecordService;

    @GetMapping
    public ApiResult<Page<ExpenseRecordVO>> pageList(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long expenseItemId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "50") Integer pageSize) {
        return ApiResult.success(expenseRecordService.pageList(projectId, expenseItemId, startDate, endDate, pageNum, pageSize));
    }

    @GetMapping("/{id}")
    public ApiResult<ExpenseRecordVO> detail(@PathVariable Long id) {
        return ApiResult.success(expenseRecordService.detail(id));
    }

    @PostMapping
    public ApiResult<Long> create(@RequestBody @Valid ExpenseRecordDTO dto) {
        return ApiResult.success(expenseRecordService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResult<Void> update(@PathVariable Long id, @RequestBody @Valid ExpenseRecordDTO dto) {
        expenseRecordService.update(id, dto);
        return ApiResult.success("修改成功");
    }

    @DeleteMapping("/{id}")
    public ApiResult<Void> delete(@PathVariable Long id) {
        expenseRecordService.delete(id);
        return ApiResult.success("删除成功");
    }
}
