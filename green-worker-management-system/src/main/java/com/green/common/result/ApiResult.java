package com.green.common.result;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 统一接口返回对象
 *
 * <p>所有 Controller 接口统一返回此对象，保证前端接收的数据结构一致。</p>
 * <p>禁止在 Controller 中直接返回原始对象或 void。</p>
 *
 * <h3>标准响应格式示例</h3>
 * <pre>
 * {
 *   "code": 200,
 *   "message": "操作成功",
 *   "data": { ... },
 *   "timestamp": "2026-06-04T18:30:00"
 * }
 * </pre>
 *
 * @param <T> 业务数据类型
 * @author Green Team
 * @version 1.0.0
 */
@Data
public class ApiResult<T> {

    /**
     * 业务状态码
     * <p>200 表示成功，其余为各类业务异常（见 {@link ResultCodeEnum}）</p>
     */
    private Integer code;

    /**
     * 提示信息
     * <p>成功时为简短描述，失败时为具体错误原因（供前端弹窗展示）</p>
     */
    private String message;

    /**
     * 业务数据
     * <p>成功时携带具体数据，失败时通常为 null</p>
     */
    private T data;

    /**
     * 响应时间戳
     * <p>便于前后端联调时排查问题、比对时区</p>
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime timestamp;

    /**
     * 私有构造方法，强制使用静态工厂方法创建实例
     */
    private ApiResult() {
        this.timestamp = LocalDateTime.now();
    }

    // ==================== 成功响应 ====================

    /**
     * 成功响应（无数据）
     */
    public static <T> ApiResult<T> success() {
        ApiResult<T> result = new ApiResult<>();
        result.setCode(ResultCodeEnum.SUCCESS.getCode());
        result.setMessage(ResultCodeEnum.SUCCESS.getMessage());
        return result;
    }

    /**
     * 成功响应（携带数据）
     *
     * @param data 业务数据
     */
    public static <T> ApiResult<T> success(T data) {
        ApiResult<T> result = new ApiResult<>();
        result.setCode(ResultCodeEnum.SUCCESS.getCode());
        result.setMessage(ResultCodeEnum.SUCCESS.getMessage());
        result.setData(data);
        return result;
    }

    /**
     * 成功响应（自定义消息 + 携带数据）
     *
     * @param message 自定义成功消息
     * @param data    业务数据
     */
    public static <T> ApiResult<T> success(String message, T data) {
        ApiResult<T> result = new ApiResult<>();
        result.setCode(ResultCodeEnum.SUCCESS.getCode());
        result.setMessage(message);
        result.setData(data);
        return result;
    }

    // ==================== 失败响应 ====================

    /**
     * 失败响应（使用预定义错误码）
     *
     * @param resultCode 错误码枚举
     */
    public static <T> ApiResult<T> error(ResultCodeEnum resultCode) {
        ApiResult<T> result = new ApiResult<>();
        result.setCode(resultCode.getCode());
        result.setMessage(resultCode.getMessage());
        return result;
    }

    /**
     * 失败响应（使用预定义错误码 + 自定义消息）
     *
     * @param resultCode 错误码枚举
     * @param message    自定义错误消息（覆盖枚举默认消息）
     */
    public static <T> ApiResult<T> error(ResultCodeEnum resultCode, String message) {
        ApiResult<T> result = new ApiResult<>();
        result.setCode(resultCode.getCode());
        result.setMessage(message);
        return result;
    }

    /**
     * 失败响应（自定义错误码 + 自定义消息）
     *
     * @param code    错误码
     * @param message 错误消息
     */
    public static <T> ApiResult<T> error(Integer code, String message) {
        ApiResult<T> result = new ApiResult<>();
        result.setCode(code);
        result.setMessage(message);
        return result;
    }

    /**
     * 判断当前响应是否为成功状态
     */
    public boolean isSuccess() {
        return ResultCodeEnum.SUCCESS.getCode().equals(this.code);
    }
}
