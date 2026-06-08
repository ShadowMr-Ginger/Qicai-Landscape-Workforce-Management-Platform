package com.green.module.anomaly.constants;

import lombok.Getter;

/**
 * 异常类型枚举
 */
@Getter
public enum AnomalyTypeEnum {

    /**
     * 重名异常
     */
    DUPLICATE_NAME(1, "重名异常"),

    /**
     * 重复考勤异常
     */
    DUPLICATE_ATTENDANCE(2, "重复考勤异常"),

    /**
     * 超长加班异常
     */
    OVERTIME_TOO_LONG(3, "超长加班异常");

    private final Integer code;
    private final String description;

    AnomalyTypeEnum(Integer code, String description) {
        this.code = code;
        this.description = description;
    }

    public static AnomalyTypeEnum fromCode(Integer code) {
        if (code == null) {
            return null;
        }
        for (AnomalyTypeEnum value : values()) {
            if (value.code.equals(code)) {
                return value;
            }
        }
        return null;
    }
}
