package com.green.module.project.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.green.module.project.entity.ProjectRevenueRecordItemEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface ProjectRevenueRecordItemMapper extends BaseMapper<ProjectRevenueRecordItemEntity> {

    @Select("SELECT id, record_id, service_name, worker_type, quantity, unit_price, total_price, remark " +
            "FROM project_revenue_record_items WHERE record_id = #{recordId}")
    List<ProjectRevenueRecordItemEntity> selectByRecordId(@Param("recordId") Long recordId);
}
