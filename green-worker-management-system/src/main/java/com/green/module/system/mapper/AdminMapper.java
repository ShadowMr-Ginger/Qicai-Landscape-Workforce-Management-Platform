package com.green.module.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.green.module.system.entity.AdminEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 管理员数据访问层
 *
 * <p>继承 MyBatis-Plus 的 {@link BaseMapper}，提供基础的 CRUD 能力。</p>
 * <p>本系统管理员数量极少（1~2人），无需复杂查询，BaseMapper 已足够。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Mapper
public interface AdminMapper extends BaseMapper<AdminEntity> {
}
