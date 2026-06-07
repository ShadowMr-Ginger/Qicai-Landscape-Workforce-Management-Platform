package com.green.module.driver.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.green.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 司机常用工人实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("driver_favorite_workers")
public class DriverFavoriteWorkerEntity extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /** 司机ID */
    private Long driverId;

    /** 工人ID */
    private Long workerId;
}
