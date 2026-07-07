package com.green.module.ledger.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 记录台账 VO
 */
@Data
public class LedgerVO {

    private Long id;

    private Long projectId;

    private String projectName;

    private LocalDate recordDate;

    private BigDecimal totalAmount;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;

    private List<LedgerItemVO> items;

    @Data
    public static class LedgerItemVO {

        private Long id;

        private Long ledgerId;

        private String serviceName;

        private Integer workerType;

        private String workerTypeText;

        private Integer quantity;

        private BigDecimal unitPrice;

        private BigDecimal totalPrice;

        private Integer sortOrder;
    }
}
