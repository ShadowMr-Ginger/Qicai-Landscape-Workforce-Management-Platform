package com.green.module.ledger.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.green.common.result.ApiResult;
import com.green.module.ledger.dto.LedgerDTO;
import com.green.module.ledger.service.LedgerService;
import com.green.module.ledger.vo.LedgerVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * 记录台账管理接口
 */
@RestController
@RequestMapping("/api/admin/ledgers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class LedgerController {

    private final LedgerService ledgerService;

    @GetMapping
    public ApiResult<Page<LedgerVO>> pageList(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "50") Integer pageSize) {
        return ApiResult.success(ledgerService.pageList(projectId, startDate, endDate, pageNum, pageSize));
    }

    @GetMapping("/{id}")
    public ApiResult<LedgerVO> detail(@PathVariable Long id) {
        return ApiResult.success(ledgerService.detail(id));
    }

    @PostMapping
    public ApiResult<Long> create(@RequestBody @Valid LedgerDTO dto) {
        return ApiResult.success(ledgerService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResult<Void> update(@PathVariable Long id, @RequestBody @Valid LedgerDTO dto) {
        ledgerService.update(id, dto);
        return ApiResult.success("修改成功");
    }

    @DeleteMapping("/{id}")
    public ApiResult<Void> delete(@PathVariable Long id) {
        ledgerService.delete(id);
        return ApiResult.success("删除成功");
    }
}
