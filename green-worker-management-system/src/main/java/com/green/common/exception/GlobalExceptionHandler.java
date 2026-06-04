package com.green.common.exception;

import com.green.common.result.ApiResult;
import com.green.common.result.ResultCodeEnum;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 全局异常处理器
 *
 * <p>统一捕获 Controller 层抛出的各类异常，转换为标准 {@link ApiResult} 响应。</p>
 * <p>处理优先级：具体异常类型越精确的处理器越优先。</p>
 *
 * <h3>处理的异常类型</h3>
 * <ul>
 *     <li>{@link BusinessException} — 业务校验失败</li>
 *     <li>{@link MethodArgumentNotValidException} / {@link BindException} — 参数校验失败（@Valid）</li>
 *     <li>{@link ConstraintViolationException} — 参数校验失败（@Validated）</li>
 *     <li>{@link BadCredentialsException} — 登录密码错误</li>
 *     <li>{@link DisabledException} — 账号被禁用</li>
 *     <li>{@link AccessDeniedException} — 权限不足</li>
 *     <li>{@link NoHandlerFoundException} — 404 资源不存在</li>
 *     <li>{@link Exception} — 其他未预期异常（兜底）</li>
 * </ul>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ==================== 业务异常 ====================

    /**
     * 处理业务异常
     * <p>已知业务规则校验失败，直接返回具体错误信息给前端</p>
     */
    @ExceptionHandler(BusinessException.class)
    public ApiResult<Void> handleBusinessException(BusinessException e, HttpServletRequest request) {
        log.warn("[业务异常] URI={} | Code={} | Message={}",
                request.getRequestURI(), e.getCode(), e.getMessage());
        return ApiResult.error(e.getCode(), e.getMessage());
    }

    // ==================== 参数校验异常 ====================

    /**
     * 处理 @RequestBody 参数校验失败（@Valid 注解）
     * <p>例如：字段为空、长度超限、格式不正确等</p>
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ApiResult<Void> handleMethodArgumentNotValidException(MethodArgumentNotValidException e,
                                                                  HttpServletRequest request) {
        List<FieldError> fieldErrors = e.getBindingResult().getFieldErrors();
        String message = fieldErrors.stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining("；"));
        log.warn("[参数校验失败] URI={} | Message={}", request.getRequestURI(), message);
        return ApiResult.error(ResultCodeEnum.BAD_REQUEST, message);
    }

    /**
     * 处理 @ModelAttribute / 表单参数绑定校验失败
     */
    @ExceptionHandler(BindException.class)
    public ApiResult<Void> handleBindException(BindException e, HttpServletRequest request) {
        List<FieldError> fieldErrors = e.getFieldErrors();
        String message = fieldErrors.stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining("；"));
        log.warn("[参数绑定失败] URI={} | Message={}", request.getRequestURI(), message);
        return ApiResult.error(ResultCodeEnum.BAD_REQUEST, message);
    }

    /**
     * 处理 @RequestParam / @PathVariable 参数校验失败（@Validated 注解）
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ApiResult<Void> handleConstraintViolationException(ConstraintViolationException e,
                                                               HttpServletRequest request) {
        Set<ConstraintViolation<?>> violations = e.getConstraintViolations();
        String message = violations.stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.joining("；"));
        log.warn("[参数校验失败] URI={} | Message={}", request.getRequestURI(), message);
        return ApiResult.error(ResultCodeEnum.BAD_REQUEST, message);
    }

    // ==================== 登录与权限异常 ====================

    /**
     * 处理登录密码错误
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ApiResult<Void> handleBadCredentialsException(BadCredentialsException e,
                                                          HttpServletRequest request) {
        log.warn("[登录失败] URI={} | Message={}", request.getRequestURI(), e.getMessage());
        return ApiResult.error(ResultCodeEnum.LOGIN_FAILED);
    }

    /**
     * 处理账号被禁用
     */
    @ExceptionHandler(DisabledException.class)
    public ApiResult<Void> handleDisabledException(DisabledException e,
                                                    HttpServletRequest request) {
        log.warn("[账号禁用] URI={} | Message={}", request.getRequestURI(), e.getMessage());
        return ApiResult.error(ResultCodeEnum.ACCOUNT_DISABLED);
    }

    /**
     * 处理权限不足（Spring Security @PreAuthorize 拒绝）
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ApiResult<Void> handleAccessDeniedException(AccessDeniedException e,
                                                        HttpServletRequest request) {
        log.warn("[权限不足] URI={} | Message={}", request.getRequestURI(), e.getMessage());
        return ApiResult.error(ResultCodeEnum.FORBIDDEN);
    }

    // ==================== 系统异常 ====================

    /**
     * 处理 404 资源不存在
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    public ApiResult<Void> handleNoHandlerFoundException(NoHandlerFoundException e,
                                                          HttpServletRequest request) {
        log.warn("[资源不存在] URI={} | Message={}", request.getRequestURI(), e.getMessage());
        return ApiResult.error(ResultCodeEnum.NOT_FOUND);
    }

    /**
     * 兜底异常处理器
     * <p>捕获所有未预期的异常，记录完整堆栈，返回通用错误提示（避免暴露敏感信息）</p>
     */
    @ExceptionHandler(Exception.class)
    public ApiResult<Void> handleException(Exception e, HttpServletRequest request) {
        log.error("[系统异常] URI={} | Message={}", request.getRequestURI(), e.getMessage(), e);
        return ApiResult.error(ResultCodeEnum.INTERNAL_SERVER_ERROR);
    }
}
