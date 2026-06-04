package com.green.common.result;

import lombok.Getter;

/**
 * 统一返回状态码枚举
 *
 * <p>所有接口返回的状态码必须在此枚举中定义，禁止在代码中硬编码数字。</p>
 * <p>状态码分段规则：</p>
 * <ul>
 *     <li>200：通用成功</li>
 *     <li>400~499：客户端错误（参数错误、权限不足、资源不存在等）</li>
 *     <li>500~599：服务端错误（数据库异常、系统内部错误等）</li>
 *     <li>1000~1999：业务相关错误（考勤、工资、审核等业务规则校验）</li>
 * </ul>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Getter
public enum ResultCodeEnum {

    // ==================== 通用成功 ====================
    /**
     * 操作成功
     */
    SUCCESS(200, "操作成功"),

    // ==================== 客户端错误 4xx ====================
    /**
     * 请求参数错误
     */
    BAD_REQUEST(400, "请求参数错误"),
    /**
     * 未登录或登录已过期
     */
    UNAUTHORIZED(401, "未登录或登录已过期，请重新登录"),
    /**
     * 无权限访问
     */
    FORBIDDEN(403, "无权访问该资源"),
    /**
     * 请求的资源不存在
     */
    NOT_FOUND(404, "请求的资源不存在"),
    /**
     * 请求方式不支持
     */
    METHOD_NOT_ALLOWED(405, "请求方式不支持"),

    // ==================== 服务端错误 5xx ====================
    /**
     * 系统内部错误
     */
    INTERNAL_SERVER_ERROR(500, "系统内部错误，请联系管理员"),
    /**
     * 服务暂不可用
     */
    SERVICE_UNAVAILABLE(503, "服务暂不可用，请稍后再试"),

    // ==================== 业务错误 1000~1999 ====================
    /**
     * 业务校验失败（通用）
     */
    BUSINESS_ERROR(1000, "业务校验失败"),
    /**
     * 账号或密码错误
     */
    LOGIN_FAILED(1001, "账号或密码错误"),
    /**
     * 账号已被禁用
     */
    ACCOUNT_DISABLED(1002, "账号已被禁用，请联系管理员"),
    /**
     * Token 无效或已过期
     */
    TOKEN_INVALID(1003, "登录状态已失效，请重新登录"),
    /**
     * 首次登录必须修改密码
     */
    PASSWORD_MUST_CHANGE(1004, "首次登录，请先修改默认密码"),
    /**
     * 旧密码错误
     */
    OLD_PASSWORD_ERROR(1005, "旧密码错误"),
    /**
     * 数据已存在
     */
    DATA_ALREADY_EXISTS(1006, "数据已存在"),
    /**
     * 数据不存在
     */
    DATA_NOT_FOUND(1007, "数据不存在"),
    /**
     * 该工人当天已有考勤记录
     */
    ATTENDANCE_DUPLICATE(1008, "该工人当天已有考勤记录，无法重复提交"),
    /**
     * 批次状态不允许此操作
     */
    BATCH_STATUS_ERROR(1009, "当前批次状态不允许执行此操作"),
    /**
     * 审核时必须分配项目
     */
    PROJECT_REQUIRED(1010, "审核时必须为工人分配项目"),
    /**
     * 考勤记录已结清，不可修改
     */
    ALREADY_SETTLED(1011, "该考勤记录已结清，不允许修改"),
    /**
     * 微信OpenID绑定失败
     */
    WX_BIND_FAILED(1012, "微信绑定失败，请稍后重试"),
    /**
     * 文件上传失败
     */
    UPLOAD_FAILED(1013, "文件上传失败");

    /**
     * 状态码
     */
    private final Integer code;

    /**
     * 默认提示消息
     */
    private final String message;

    ResultCodeEnum(Integer code, String message) {
        this.code = code;
        this.message = message;
    }
}
