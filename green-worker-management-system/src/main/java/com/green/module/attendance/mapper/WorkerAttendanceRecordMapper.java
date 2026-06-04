package com.green.module.attendance.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.green.module.attendance.entity.WorkerAttendanceRecordEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 工人考勤记录数据访问层
 *
 * @author Green Team
 * @version 1.0.0
 */
@Mapper
public interface WorkerAttendanceRecordMapper extends BaseMapper<WorkerAttendanceRecordEntity> {
}
