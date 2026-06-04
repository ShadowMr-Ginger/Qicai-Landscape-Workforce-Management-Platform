package com.green.module.worker.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 工人详情视图对象
 *
 * <p>包含工人的全部字段信息，用于详情弹窗/页面展示。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Data
public class WorkerDetailVO {

    /**
     * 工人ID
     */
    private Long id;

    /**
     * 姓名
     */
    private String name;

    /**
     * 性别文本
     */
    private String genderText;

    /**
     * 所属组别名称
     */
    private String groupName;

    /**
     * 手机号
     */
    private String phone;

    /**
     * 身份证号
     */
    private String idCard;

    /**
     * 基础日薪（元）
     */
    private BigDecimal baseDailySalary;

    /**
     * 加班时薪（元/小时）
     */
    private BigDecimal overtimeHourlyRate;

    /**
     * 紧急联系人电话
     */
    private String emergencyContactPhone;

    /**
     * 是否技术工人文本
     */
    private String isSkilledWorkerText;

    /**
     * 是否在职文本
     */
    private String isEmployedText;

    /**
     * 默认项目名称
     */
    private String defaultProjectName;

    /**
     * 创建时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;
}
