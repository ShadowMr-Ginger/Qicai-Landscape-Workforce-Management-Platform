package com.green.common.constants;

/**
 * 系统常量定义
 *
 * <p>集中管理项目中使用的魔法值、配置键、缓存前缀等。</p>
 * <p>禁止在业务代码中直接硬编码字符串或数字，必须引用此类的常量。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
public final class SystemConstants {

    /**
     * 私有构造方法，防止实例化
     */
    private SystemConstants() {
    }

    // ==================== JWT 相关 ====================

    /**
     * JWT 签名密钥（实际从配置文件读取，此处仅作配置键说明）
     */
    public static final String JWT_SECRET_KEY = "${jwt.secret}";

    /**
     * JWT Token 前缀
     */
    public static final String TOKEN_PREFIX = "Bearer ";

    /**
     * Token 存放在请求头中的字段名
     */
    public static final String TOKEN_HEADER = "Authorization";

    /**
     * 管理员 Token 在 Redis 中的前缀
     */
    public static final String ADMIN_TOKEN_KEY_PREFIX = "token:admin:";

    /**
     * 司机 Token 在 Redis 中的前缀
     */
    public static final String DRIVER_TOKEN_KEY_PREFIX = "token:driver:";

    // ==================== 角色标识 ====================

    /**
     * 角色前缀（Spring Security 要求 ROLE_ 前缀）
     */
    public static final String ROLE_PREFIX = "ROLE_";

    /**
     * 管理员角色标识
     */
    public static final String ROLE_ADMIN = "ADMIN";

    /**
     * 司机角色标识
     */
    public static final String ROLE_DRIVER = "DRIVER";

    // ==================== 缓存相关 ====================

    /**
     * 验证码缓存前缀
     */
    public static final String CAPTCHA_KEY_PREFIX = "captcha:";

    /**
     * 系统配置缓存前缀
     */
    public static final String CONFIG_KEY_PREFIX = "config:";

    // ==================== 业务常量 ====================

    /**
     * 司机默认密码（明文，首次登录后必须修改）
     */
    public static final String DRIVER_DEFAULT_PASSWORD = "123456";

    /**
     * 加班时长最小粒度（小时）
     */
    public static final double OVERTIME_MIN_UNIT = 0.5;

    /**
     * 单批次最大工人数
     */
    public static final int MAX_WORKERS_PER_BATCH = 50;

    /**
     * 日期时间格式
     */
    public static final String DATE_TIME_PATTERN = "yyyy-MM-dd HH:mm:ss";

    /**
     * 日期格式
     */
    public static final String DATE_PATTERN = "yyyy-MM-dd";
}
