package com.green.common.enums;

import lombok.Getter;

/**
 * 考勤批次状态枚举
 *
 * <p>批次是审核的主体，仅有三种状态流转：</p>
 * <ul>
 *     <li>待审核（0）：司机刚提交，管理员尚未审核</li>
 *     <li>已通过（1）：管理员审核通过，工资已固化</li>
 *     <li>已撤回（2）：司机在审核前主动撤回，关联的工人考勤记录被删除</li>
 * </ul>
 *
 * <h3>状态流转规则</h3>
 * <pre>
 * 待审核 --(管理员审核通过)--> 已通过
 * 待审核 --(司机撤回)--> 已撤回
 * </pre>
 * <p>已通过和已撤回的批次不允许再次流转。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Getter
public enum BatchStatusEnum {

    /**
     * 待审核
     */
    PENDING(0, "待审核"),

    /**
     * 已通过
     */
    APPROVED(1, "已通过"),

    /**
     * 已撤回
     */
    WITHDRAWN(2, "已撤回"),

    /**
     * 不通过
     */
    REJECTED(3, "不通过");

    private final Integer code;
    private final String description;

    BatchStatusEnum(Integer code, String description) {
        this.code = code;
        this.description = description;
    }

    public static BatchStatusEnum fromCode(Integer code) {
        for (BatchStatusEnum status : values()) {
            if (status.getCode().equals(code)) {
                return status;
            }
        }
        return null;
    }
}
