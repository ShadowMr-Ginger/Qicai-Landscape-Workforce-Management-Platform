package com.green.module.attendance.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.green.module.attendance.entity.DriverAttendanceRecordEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

/**
 * 司机考勤记录数据访问层
 *
 * @author Green Team
 * @version 1.0.0
 */
@Mapper
public interface DriverAttendanceRecordMapper extends BaseMapper<DriverAttendanceRecordEntity> {

    /**
     * 查询存在考勤记录的所有年月
     */
    @Select("SELECT DISTINCT YEAR(attendance_date) AS year, MONTH(attendance_date) AS month " +
            "FROM driver_attendance_records WHERE deleted = 0 ORDER BY year DESC, month DESC")
    List<Map<String, Object>> selectDistinctMonths();
}
