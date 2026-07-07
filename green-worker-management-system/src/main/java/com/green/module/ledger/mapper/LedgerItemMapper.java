package com.green.module.ledger.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.green.module.ledger.entity.LedgerItemEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 台账用工记录明细数据访问层
 */
@Mapper
public interface LedgerItemMapper extends BaseMapper<LedgerItemEntity> {

    @Select("SELECT id, ledger_id, service_name, worker_type, quantity, unit_price, total_price, sort_order, create_time, update_time " +
            "FROM ledger_items WHERE ledger_id = #{ledgerId} AND deleted = 0 ORDER BY sort_order ASC, id ASC")
    List<LedgerItemEntity> selectByLedgerId(@Param("ledgerId") Long ledgerId);
}
