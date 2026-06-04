package com.green.module.attendance.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.green.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 司机考勤记录实体
 *
 * @author Green Team
 * @version 1.0.0
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("driver_attendance_records")
public class DriverAttendanceRecordEntity extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 司机ID
     */
    private Long driverId;
}
