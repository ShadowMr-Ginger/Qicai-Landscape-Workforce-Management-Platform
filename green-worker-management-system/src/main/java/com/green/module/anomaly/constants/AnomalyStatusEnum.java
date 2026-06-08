package com.green.module.anomaly.constants;

import lombok.Getter;

/**
 * 异常状态枚举
 */
@Getter
public enum AnomalyStatusEnum {

    /**
     * 未处理
     */
    UNRESOLVED(0, "未处理"),

    /**
     * 已处理
     */
    RESOLVED(1, "已处理");

    private final Integer code;
    private final String description;

    AnomalyStatusEnum(Integer code, String description) {
        this.code = code;
        this.description = description;
    }

    public static AnomalyStatusEnum fromCode(Integer code) {
        if (code == null) {
            return null;
        }
        for (AnomalyStatusEnum value : values()) {
            if (value.code.equals(code)) {
                return value;
            }
        }
        return null;
    }
}
