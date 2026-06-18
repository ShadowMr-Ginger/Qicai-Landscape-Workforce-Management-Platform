package com.green.module.attendance.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 考勤批次工人明细临时实体
 * <p>保存待审核/已撤回批次中的工人考勤明细，审核通过后写入 worker_attendance_records。</p>
 */
@Data
@TableName("attendance_batch_worker_items")
public class AttendanceBatchWorkerItemEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    /** 主键ID */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /** 所属考勤批次ID */
    private Long batchId;

    /** 工人ID */
    private Long workerId;

    /** 分配的项目ID */
    private Long projectId;

    /** 出勤类型: 1-半天, 2-全天 */
    private Integer attendanceType;

    /** 加班时长(小时) */
    private BigDecimal overtimeHours;

    /** 工作类型ID */
    private Long workTypeId;

    /** 当日基础工资(元) */
    private BigDecimal dailyWage;

    /** 当日加班工资(元) */
    private BigDecimal overtimeWage;

    /** 当日总工资(元) */
    private BigDecimal totalWage;

    /** 备注 */
    private String remark;

    /** 创建时间 */
    private LocalDateTime createTime;

    /** 更新时间 */
    private LocalDateTime updateTime;
}
