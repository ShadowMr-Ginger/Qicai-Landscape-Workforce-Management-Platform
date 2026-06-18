package com.green.module.attendance.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.green.module.attendance.entity.AttendanceBatchDriverItemEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 考勤批次司机明细临时表数据访问层
 */
@Mapper
public interface AttendanceBatchDriverItemMapper extends BaseMapper<AttendanceBatchDriverItemEntity> {
}
