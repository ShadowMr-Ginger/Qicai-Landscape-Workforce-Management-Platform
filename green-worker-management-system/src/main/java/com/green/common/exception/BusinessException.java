package com.green.common.exception;

import com.green.common.result.ResultCodeEnum;
import lombok.Getter;

/**
 * 业务异常
 *
 * <p>用于封装所有可预期的业务规则校验失败场景。</p>
 * <p>与 {@link java.lang.RuntimeException} 的区别在于：业务异常是"已知错误"，
 * 需要被 {@link GlobalExceptionHandler} 捕获并返回给前端具体的错误提示；
 * 而 RuntimeException 通常是"未知错误"，需要记录堆栈并返回通用系统错误。</p>
 *
 * <h3>使用场景示例</h3>
 * <pre>
 * if (batch.getStatus() != BatchStatusEnum.PENDING.getCode()) {
 *     throw new BusinessException(ResultCodeEnum.BATCH_STATUS_ERROR, "只有待审核的批次才能撤回");
 * }
 * </pre>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Getter
public class BusinessException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    /**
     * 业务错误码
     */
    private final Integer code;

    /**
     * 构造业务异常（使用预定义错误码）
     *
     * @param resultCode 错误码枚举
     */
    public BusinessException(ResultCodeEnum resultCode) {
        super(resultCode.getMessage());
        this.code = resultCode.getCode();
    }

    /**
     * 构造业务异常（使用预定义错误码 + 自定义消息）
     *
     * @param resultCode 错误码枚举
     * @param message    自定义错误消息（覆盖枚举默认值）
     */
    public BusinessException(ResultCodeEnum resultCode, String message) {
        super(message);
        this.code = resultCode.getCode();
    }

    /**
     * 构造业务异常（自定义错误码 + 自定义消息）
     *
     * @param code    错误码
     * @param message 错误消息
     */
    public BusinessException(Integer code, String message) {
        super(message);
        this.code = code;
    }
}
