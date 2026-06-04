package com.green.common.enums;

import lombok.Getter;

/**
 * 出勤类型枚举
 *
 * <p>定义工人/司机当天的出勤状态，直接影响工资计算：</p>
 * <ul>
 *     <li>半天 = 基础日薪 × 0.5</li>
 *     <li>全天 = 基础日薪 × 1.0</li>
 * </ul>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Getter
public enum AttendanceStatusEnum {

    /**
     * 半天
     */
    HALF_DAY(1, "半天"),

    /**
     * 全天
     */
    FULL_DAY(2, "全天");

    private final Integer code;
    private final String description;

    AttendanceStatusEnum(Integer code, String description) {
        this.code = code;
        this.description = description;
    }

    public static AttendanceStatusEnum fromCode(Integer code) {
        for (AttendanceStatusEnum type : values()) {
            if (type.getCode().equals(code)) {
                return type;
            }
        }
        return null;
    }
}
