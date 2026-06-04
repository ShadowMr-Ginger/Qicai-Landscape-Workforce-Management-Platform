package com.green.module.group.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.green.module.group.entity.GroupEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 组别数据访问层
 *
 * @author Green Team
 * @version 1.0.0
 */
@Mapper
public interface GroupMapper extends BaseMapper<GroupEntity> {
}
