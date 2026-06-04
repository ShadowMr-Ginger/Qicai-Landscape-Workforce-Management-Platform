package com.green.module.driver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.green.module.driver.entity.DriverEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 司机数据访问层
 *
 * <p>继承 MyBatis-Plus 的 {@link BaseMapper}，提供基础的 CRUD 能力。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Mapper
public interface DriverMapper extends BaseMapper<DriverEntity> {
}
