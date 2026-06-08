package com.green.module.anomaly.constants;

import lombok.Getter;

/**
 * 异常子类型枚举
 */
@Getter
public enum AnomalySubTypeEnum {

    /**
     * 工人
     */
    WORKER(1, "工人"),

    /**
     * 司机
     */
    DRIVER(2, "司机");

    private final Integer code;
    private final String description;

    AnomalySubTypeEnum(Integer code, String description) {
        this.code = code;
        this.description = description;
    }

    public static AnomalySubTypeEnum fromCode(Integer code) {
        if (code == null) {
            return null;
        }
        for (AnomalySubTypeEnum value : values()) {
            if (value.code.equals(code)) {
                return value;
            }
        }
        return null;
    }
}
