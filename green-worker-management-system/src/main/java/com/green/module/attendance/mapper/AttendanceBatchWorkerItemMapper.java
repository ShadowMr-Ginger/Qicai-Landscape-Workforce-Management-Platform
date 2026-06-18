package com.green.module.attendance.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.green.module.attendance.entity.AttendanceBatchWorkerItemEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 考勤批次工人明细临时表数据访问层
 */
@Mapper
public interface AttendanceBatchWorkerItemMapper extends BaseMapper<AttendanceBatchWorkerItemEntity> {
}
