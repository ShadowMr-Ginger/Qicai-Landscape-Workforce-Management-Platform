package com.green.module.worker.dto;

import com.green.common.base.BaseQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 工人列表查询参数
 *
 * <p>支持按姓名关键词、性别、是否技术工、组别、在职状态筛选。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class WorkerQuery extends BaseQuery {

    /**
     * 姓名关键词（模糊查询）
     */
    private String keyword;

    /**
     * 性别：1-男，2-女
     */
    private Integer gender;

    /**
     * 是否技术工人：1-是，0-否
     */
    private Integer isSkilledWorker;

    /**
     * 组别ID
     */
    private Long groupId;

    /**
     * 是否在职：1-在职，0-离职
     * <p>默认查询在职工人</p>
     */
    private Integer isEmployed = 1;
}
