package com.green.module.worker.vo;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 工人列表项视图对象
 *
 * <p>表格展示用，仅包含必要字段。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Data
public class WorkerListVO {

    /**
     * 工人ID
     */
    private Long id;

    /**
     * 姓名
     */
    private String name;

    /**
     * 性别文本：男 / 女
     */
    private String genderText;

    /**
     * 是否技术工人：是 / 否
     */
    private String isSkilledWorkerText;

    /**
     * 手机号
     */
    private String phone;

    /**
     * 基础日薪（元）
     */
    private BigDecimal baseDailySalary;

    /**
     * 加班时薪（元/小时）
     */
    private BigDecimal overtimeHourlyRate;

    /**
     * 所属组别ID
     */
    private Long groupId;

    /**
     * 所属组别名称
     */
    private String groupName;

    /**
     * 是否在职：1-在职，0-离职
     */
    private Integer isEmployed;
}
