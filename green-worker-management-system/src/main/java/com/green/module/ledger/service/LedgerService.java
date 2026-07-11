package com.green.module.ledger.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.green.module.ledger.dto.LedgerDTO;
import com.green.module.ledger.vo.LedgerVO;

import java.time.LocalDate;

/**
 * 记录台账服务接口
 */
public interface LedgerService {

    /**
     * 分页查询台账列表
     */
    Page<LedgerVO> pageList(Long projectId, LocalDate startDate, LocalDate endDate, Integer pageNum, Integer pageSize);

    /**
     * 查询项目下的所有台账（用于营业记录投影）
     */
    java.util.List<LedgerVO> listByProject(Long projectId);

    /**
     * 查询指定日期范围内某个项目的台账列表（用于营业记录投影）
     */
    java.util.List<LedgerVO> listByProjectAndDateRange(Long projectId, LocalDate startDate, LocalDate endDate);

    /**
     * 查询指定日期范围内的所有台账列表（按日期升序，用于台账导出）
     */
    java.util.List<LedgerVO> listByDateRange(LocalDate startDate, LocalDate endDate);

    /**
     * 导出台账报表
     */
    void exportLedgers(LocalDate startDate, LocalDate endDate, String format,
                       jakarta.servlet.http.HttpServletResponse response) throws java.io.IOException;

    /**
     * 台账详情
     */
    LedgerVO detail(Long id);

    /**
     * 新增台账
     */
    Long create(LedgerDTO dto);

    /**
     * 修改台账
     */
    void update(Long id, LedgerDTO dto);

    /**
     * 删除台账
     */
    void delete(Long id);
}
