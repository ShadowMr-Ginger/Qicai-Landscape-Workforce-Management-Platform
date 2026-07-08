package com.green.module.ledger.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * 记录台账保存/更新 DTO
 */
@Data
public class LedgerDTO {

    private Long id;

    @NotNull(message = "项目不能为空")
    private Long projectId;

    @NotNull(message = "台账日期不能为空")
    private LocalDate recordDate;

    @NotEmpty(message = "请至少添加一条用工记录")
    private List<@Valid LedgerItemDTO> items;

    @Data
    public static class LedgerItemDTO {

        private Long id;

        @NotNull(message = "服务名称不能为空")
        private String serviceName;

        /** 工人类型: null-未选择, 1-男工, 2-女工 */
        private Integer workerType;

        @NotNull(message = "数量不能为空")
        @Min(value = 1, message = "数量至少为1")
        private Integer quantity;

        @NotNull(message = "单价不能为空")
        @Min(value = 0, message = "单价不能为负数")
        private BigDecimal unitPrice;

        /** 备注 */
        private String remark;
    }
}
