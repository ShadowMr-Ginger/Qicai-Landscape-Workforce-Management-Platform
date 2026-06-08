package com.green.module.anomaly.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.green.common.base.BaseQuery;
import com.green.common.result.ApiResult;
import com.green.common.result.ResultCodeEnum;
import com.green.module.anomaly.dto.AnomalyRecordQuery;
import com.green.module.anomaly.service.AnomalyRecordService;
import com.green.module.anomaly.vo.AnomalyRecordVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 异常记录管理接口
 */
@RestController
@RequestMapping("/api/admin/anomalies")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AnomalyRecordController {

    private final AnomalyRecordService anomalyRecordService;

    /**
     * 分页查询异常记录
     */
    @GetMapping
    public ApiResult<IPage<AnomalyRecordVO>> list(AnomalyRecordQuery query) {
        return ApiResult.success(anomalyRecordService.list(query));
    }

    /**
     * 查询异常记录详情
     */
    @GetMapping("/{id}")
    public ApiResult<AnomalyRecordVO> detail(@PathVariable Long id) {
        return ApiResult.success(anomalyRecordService.detail(id));
    }

    /**
     * 标记异常为已处理
     */
    @PutMapping("/{id}/resolve")
    public ApiResult<Void> resolve(@PathVariable Long id) {
        anomalyRecordService.resolve(id);
        return ApiResult.success();
    }

    /**
     * 删除异常记录
     */
    @DeleteMapping("/{id}")
    public ApiResult<Void> delete(@PathVariable Long id) {
        anomalyRecordService.delete(id);
        return ApiResult.success();
    }

    /**
     * 统计未处理异常数量
     */
    @GetMapping("/stats/unresolved")
    public ApiResult<Map<String, Object>> countUnresolved() {
        long count = anomalyRecordService.countUnresolved();
        Map<String, Object> data = new HashMap<>();
        data.put("count", count);
        return ApiResult.success(data);
    }

    /**
     * 执行全局异常检测
     */
    @PostMapping("/global-check")
    public ApiResult<Map<String, Object>> runGlobalCheck() {
        int affected = anomalyRecordService.runGlobalCheck();
        Map<String, Object> data = new HashMap<>();
        data.put("affected", affected);
        return ApiResult.success(data);
    }
}
