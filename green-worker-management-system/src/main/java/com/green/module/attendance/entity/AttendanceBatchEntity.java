package com.green.module.attendance.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.green.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 考勤批次实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("attendance_batches")
public class AttendanceBatchEntity extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /** 提交司机ID */
    private Long driverId;

    /** 考勤日期 */
    private LocalDate batchDate;

    /** 批次状态: 0-待审核, 1-已通过, 2-已撤回 */
    private Integer status;

    /** 提交时间 */
    private LocalDateTime submitTime;

    /** 审核时间 */
    private LocalDateTime reviewTime;

    /** 审核人ID(管理员ID) */
    private Long reviewerId;

    /** 批次内工人数量 */
    private Integer totalWorkers;

    /** 备注 */
    private String remark;
}
