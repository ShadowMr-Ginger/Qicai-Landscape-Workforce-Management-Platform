package com.green.module.attendance.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.green.module.attendance.entity.WorkerAttendanceRecordEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

/**
 * 工人考勤记录数据访问层
 *
 * @author Green Team
 * @version 1.0.0
 */
@Mapper
public interface WorkerAttendanceRecordMapper extends BaseMapper<WorkerAttendanceRecordEntity> {

    /**
     * 查询存在考勤记录的所有年月
     */
    @Select("SELECT DISTINCT YEAR(attendance_date) AS year, MONTH(attendance_date) AS month " +
            "FROM worker_attendance_records WHERE deleted = 0 ORDER BY year DESC, month DESC")
    List<Map<String, Object>> selectDistinctMonths();

    /**
     * 查询指定年月存在考勤记录的组别 ID
     */
    @Select("SELECT DISTINCT w.group_id FROM worker_attendance_records r " +
            "JOIN workers w ON r.worker_id = w.id " +
            "WHERE r.deleted = 0 AND w.deleted = 0 " +
            "AND YEAR(r.attendance_date) = #{year} AND MONTH(r.attendance_date) = #{month}")
    List<Long> selectGroupIdsByMonth(@Param("year") Integer year, @Param("month") Integer month);
}
