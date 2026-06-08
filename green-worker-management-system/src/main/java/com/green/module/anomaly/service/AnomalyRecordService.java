package com.green.module.anomaly.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.green.module.anomaly.dto.AnomalyRecordQuery;
import com.green.module.anomaly.vo.AnomalyRecordVO;

/**
 * 异常记录服务接口
 */
public interface AnomalyRecordService {

    /**
     * 分页查询异常记录
     */
    IPage<AnomalyRecordVO> list(AnomalyRecordQuery query);

    /**
     * 查询异常记录详情
     */
    AnomalyRecordVO detail(Long id);

    /**
     * 标记异常为已处理
     */
    void resolve(Long id);

    /**
     * 删除异常记录
     */
    void delete(Long id);

    /**
     * 统计未处理异常数量
     */
    long countUnresolved();

    /**
     * 检查工人重名异常
     *
     * @param workerId 当前工人ID
     * @param name     当前工人姓名
     */
    void checkWorkerNameDuplicate(Long workerId, String name);

    /**
     * 检查司机重名异常
     *
     * @param driverId 当前司机ID
     * @param realName 当前司机姓名
     */
    void checkDriverNameDuplicate(Long driverId, String realName);

    /**
     * 批次审核后检查重复考勤异常
     *
     * @param batchId 批次ID
     */
    void checkAttendanceDuplicateAfterBatchReview(Long batchId);

    /**
     * 批次审核后检查超长加班异常
     *
     * @param batchId 批次ID
     */
    void checkOvertimeAfterBatchReview(Long batchId);

    /**
     * 执行全局异常检测
     * <p>对全量数据扫描重名、重复考勤、超长加班三类异常，并更新异常记录表。</p>
     *
     * @return 新增或更新的异常记录数量
     */
    int runGlobalCheck();
}
