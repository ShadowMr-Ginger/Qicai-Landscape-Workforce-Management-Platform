package com.green.module.driver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.green.module.driver.entity.DriverFavoriteWorkerEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

/**
 * 司机常用工人 Mapper
 */
@Mapper
public interface DriverFavoriteWorkerMapper extends BaseMapper<DriverFavoriteWorkerEntity> {

    /**
     * 查询指定司机与工人之间已逻辑删除的收藏记录。
     * <p>用于恢复误删的常用工人。</p>
     */
    @Select("SELECT * FROM driver_favorite_workers " +
            "WHERE driver_id = #{driverId} AND worker_id = #{workerId} AND deleted = 1 " +
            "LIMIT 1")
    DriverFavoriteWorkerEntity selectDeletedByDriverAndWorker(@Param("driverId") Long driverId,
                                                               @Param("workerId") Long workerId);

    /**
     * 恢复指定司机与工人之间已逻辑删除的收藏记录。
     */
    @Update("UPDATE driver_favorite_workers " +
            "SET deleted = 0, update_time = NOW() " +
            "WHERE driver_id = #{driverId} AND worker_id = #{workerId} AND deleted = 1")
    int restoreByDriverAndWorker(@Param("driverId") Long driverId,
                                  @Param("workerId") Long workerId);
}
