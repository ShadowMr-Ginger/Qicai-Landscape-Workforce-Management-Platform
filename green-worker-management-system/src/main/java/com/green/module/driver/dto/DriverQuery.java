package com.green.module.driver.dto;

import com.green.common.base.BaseQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 司机列表查询参数
 *
 * @author Green Team
 * @version 1.0.0
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class DriverQuery extends BaseQuery {

    /**
     * 姓名关键词（模糊查询）
     */
    private String keyword;

    /**
     * 性别：1-男，2-女
     */
    private Integer gender;

    /**
     * 是否在职：1-在职，0-离职
     * <p>默认查询在职司机</p>
     */
    private Integer isActive = 1;
}
