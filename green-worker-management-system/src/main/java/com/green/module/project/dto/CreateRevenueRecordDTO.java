package com.green.module.project.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * 创建营业记录DTO
 */
@Data
public class CreateRevenueRecordDTO {

    private Long projectId;

    @NotNull(message = "营业日期不能为空")
    private LocalDate recordDate;

    private String remark;

    @NotNull(message = "服务项不能为空")
    private List<@Valid RevenueItemDTO> items;

    @Data
    public static class RevenueItemDTO {

        @NotBlank(message = "服务名称不能为空")
        private String serviceName;

        @NotNull(message = "工人类型不能为空")
        private Integer workerType;

        @NotNull(message = "数量不能为空")
        @Min(value = 1, message = "数量至少为1")
        private Integer quantity;

        @NotNull(message = "单价不能为空")
        @Min(value = 0, message = "单价不能为负数")
        private BigDecimal unitPrice;

        private String remark;
    }
}
