package com.green.module.ledger.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 台账用工记录明细实体
 */
@Data
@TableName("ledger_items")
public class LedgerItemEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /** 所属台账ID */
    private Long ledgerId;

    /** 服务名称 */
    private String serviceName;

    /** 工人类型: 1-男工, 2-女工, null-未选择 */
    private Integer workerType;

    /** 数量 */
    private Integer quantity;

    /** 单价(元) */
    private BigDecimal unitPrice;

    /** 总价(元) */
    private BigDecimal totalPrice;

    /** 显示顺序 */
    private Integer sortOrder;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    @JsonIgnore
    private Integer deleted;
}
