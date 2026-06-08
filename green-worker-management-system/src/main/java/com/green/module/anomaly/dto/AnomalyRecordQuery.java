package com.green.module.anomaly.dto;

import com.green.common.base.BaseQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 异常记录查询参数
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class AnomalyRecordQuery extends BaseQuery {

    /**
     * 异常类型: 1-重名, 2-重复考勤, 3-超长加班
     */
    private Integer type;

    /**
     * 子类型: 1-工人, 2-司机
     */
    private Integer subType;

    /**
     * 状态: 0-未处理, 1-已处理
     */
    private Integer status;

    /**
     * 搜索关键词（标题/描述）
     */
    private String keyword;
}
