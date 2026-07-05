package com.green.module.project.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 营业记录VO
 */
@Data
public class RevenueRecordVO {

    private Long id;
    private Long projectId;
    private LocalDate recordDate;
    private BigDecimal totalAmount;
    private String remark;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;

    private List<RevenueRecordItemVO> items;

    @Data
    public static class RevenueRecordItemVO {
        private Long id;
        private String serviceName;
        private Integer workerType;
        private String workerTypeText;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
        private String remark;
    }
}
