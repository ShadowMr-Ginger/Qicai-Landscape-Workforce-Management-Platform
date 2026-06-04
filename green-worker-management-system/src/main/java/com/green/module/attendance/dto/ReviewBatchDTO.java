package com.green.module.attendance.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 审核批次并更新工人考勤记录DTO
 */
@Data
public class ReviewBatchDTO {

    @NotNull(message = "批次ID不能为空")
    private Long batchId;

    /** 工人记录更新项 */
    private List<WorkerRecordUpdateItem> workerRecords;

    @Data
    public static class WorkerRecordUpdateItem {
        @NotNull(message = "记录ID不能为空")
        private Long recordId;

        /** 作业类型ID */
        private Long workTypeId;

        /** 项目ID */
        private Long projectId;

        /** 出勤类型: 1-半天, 2-全天 */
        private Integer attendanceType;

        /** 加班时长 */
        private BigDecimal overtimeHours;

        /** 备注 */
        private String remark;
    }
}
