package com.green.module.expense.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.green.common.result.ApiResult;
import com.green.module.expense.dto.ExpenseItemDTO;
import com.green.module.expense.service.ExpenseItemService;
import com.green.module.expense.vo.ExpenseItemVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 开支项目管理接口
 */
@RestController
@RequestMapping("/api/admin/expense-items")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ExpenseItemController {

    private final ExpenseItemService expenseItemService;

    @GetMapping("/list")
    public ApiResult<Page<ExpenseItemVO>> pageList(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "50") Integer pageSize) {
        return ApiResult.success(expenseItemService.pageList(keyword, pageNum, pageSize));
    }

    @GetMapping("/all")
    public ApiResult<List<ExpenseItemVO>> listAll() {
        return ApiResult.success(expenseItemService.listAll());
    }

    @GetMapping("/{id}")
    public ApiResult<ExpenseItemVO> detail(@PathVariable Long id) {
        return ApiResult.success(expenseItemService.detail(id));
    }

    @PostMapping
    public ApiResult<Long> create(@RequestBody @Valid ExpenseItemDTO dto) {
        return ApiResult.success(expenseItemService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResult<Void> update(@PathVariable Long id, @RequestBody @Valid ExpenseItemDTO dto) {
        expenseItemService.update(id, dto);
        return ApiResult.success("修改成功");
    }

    @DeleteMapping("/{id}")
    public ApiResult<Void> delete(@PathVariable Long id) {
        expenseItemService.delete(id);
        return ApiResult.success("删除成功");
    }

    @GetMapping("/{id}/common-subjects")
    public ApiResult<List<ExpenseItemVO.CommonSubjectVO>> listCommonSubjects(@PathVariable Long id) {
        return ApiResult.success(expenseItemService.listCommonSubjects(id));
    }

    @PostMapping("/{id}/common-subjects")
    public ApiResult<Long> createCommonSubject(@PathVariable Long id,
                                                  @RequestBody @Valid ExpenseItemDTO.CommonSubjectDTO dto) {
        return ApiResult.success(expenseItemService.createCommonSubject(id, dto));
    }

    @PutMapping("/common-subjects/{id}")
    public ApiResult<Void> updateCommonSubject(@PathVariable Long id,
                                                @RequestBody @Valid ExpenseItemDTO.CommonSubjectDTO dto) {
        expenseItemService.updateCommonSubject(id, dto);
        return ApiResult.success("修改成功");
    }

    @DeleteMapping("/common-subjects/{id}")
    public ApiResult<Void> deleteCommonSubject(@PathVariable Long id) {
        expenseItemService.deleteCommonSubject(id);
        return ApiResult.success("删除成功");
    }

    @GetMapping("/{id}/common-remarks")
    public ApiResult<List<ExpenseItemVO.CommonRemarkVO>> listCommonRemarks(@PathVariable Long id) {
        return ApiResult.success(expenseItemService.listCommonRemarks(id));
    }

    @PostMapping("/{id}/common-remarks")
    public ApiResult<Long> createCommonRemark(@PathVariable Long id,
                                               @RequestBody @Valid ExpenseItemDTO.CommonRemarkDTO dto) {
        return ApiResult.success(expenseItemService.createCommonRemark(id, dto));
    }

    @PutMapping("/common-remarks/{id}")
    public ApiResult<Void> updateCommonRemark(@PathVariable Long id,
                                               @RequestBody @Valid ExpenseItemDTO.CommonRemarkDTO dto) {
        expenseItemService.updateCommonRemark(id, dto);
        return ApiResult.success("修改成功");
    }

    @DeleteMapping("/common-remarks/{id}")
    public ApiResult<Void> deleteCommonRemark(@PathVariable Long id) {
        expenseItemService.deleteCommonRemark(id);
        return ApiResult.success("删除成功");
    }
}
