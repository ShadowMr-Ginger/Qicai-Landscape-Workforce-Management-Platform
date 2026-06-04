package com.green.common.enums;

import lombok.Getter;

/**
 * 性别枚举
 *
 * @author Green Team
 * @version 1.0.0
 */
@Getter
public enum GenderEnum {

    /**
     * 男
     */
    MALE(1, "男"),

    /**
     * 女
     */
    FEMALE(2, "女");

    private final Integer code;
    private final String description;

    GenderEnum(Integer code, String description) {
        this.code = code;
        this.description = description;
    }

    public static GenderEnum fromCode(Integer code) {
        for (GenderEnum gender : values()) {
            if (gender.getCode().equals(code)) {
                return gender;
            }
        }
        return null;
    }
}
