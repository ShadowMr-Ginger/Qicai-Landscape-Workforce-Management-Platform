package com.green.module.attendance.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.green.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 工人考勤记录实体
 *
 * @author Green Team
 * @version 1.0.0
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("worker_attendance_records")
public class WorkerAttendanceRecordEntity extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 所属考勤批次ID
     */
    private Long batchId;

    /**
     * 工人ID
     */
    private Long workerId;

    /**
     * 分配的项目ID
     */
    private Long projectId;
}
