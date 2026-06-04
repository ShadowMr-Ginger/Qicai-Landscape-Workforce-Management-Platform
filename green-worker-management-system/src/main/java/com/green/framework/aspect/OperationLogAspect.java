package com.green.framework.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.green.framework.annotation.OperationLog;
import com.green.module.log.entity.LogEntity;
import com.green.module.log.mapper.LogMapper;
import com.green.security.LoginUser;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.time.LocalDateTime;

/**
 * 操作日志 AOP 切面
 *
 * <p>拦截所有标记了 {@link OperationLog} 注解的方法，自动记录操作日志。</p>
 *
 * <h3>实现原理</h3>
 * <ol>
 *     <li>{@code @Pointcut} 定义切点：所有带有 @OperationLog 注解的方法</li>
 *     <li>{@code @Around} 环绕通知：在方法执行前后记录信息</li>
 *     <li>从 {@link SecurityContextHolder} 获取当前登录用户</li>
 *     <li>从 {@link RequestContextHolder} 获取 HTTP 请求信息（IP、UA）</li>
 *     <li>异步保存到 operation_logs 表（预留线程池优化点）</li>
 * </ol>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class OperationLogAspect {

    private final LogMapper logMapper;
    private final ObjectMapper objectMapper;

    /**
     * 定义切点：所有标记了 @OperationLog 注解的方法
     */
    @Pointcut("@annotation(com.green.framework.annotation.OperationLog)")
    public void operationLogPointcut() {
    }

    /**
     * 环绕通知：记录操作日志
     *
     * @param joinPoint 连接点
     * @return 原方法的返回值
     * @throws Throwable 方法执行异常
     */
    @Around("operationLogPointcut()")
    public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
        // 记录开始时间
        long startTime = System.currentTimeMillis();

        // 获取方法上的注解信息
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        OperationLog operationLog = method.getAnnotation(OperationLog.class);

        // 获取当前登录用户
        LoginUser currentUser = getCurrentUser();

        // 获取 HTTP 请求
        HttpServletRequest request = getRequest();

        // 执行目标方法
        Object result = null;
        boolean success = true;
        String errorMsg = null;
        try {
            result = joinPoint.proceed();
        } catch (Exception e) {
            success = false;
            errorMsg = e.getMessage();
            throw e;
        } finally {
            // 构建并保存日志（放在 finally 中确保即使异常也能记录）
            try {
                saveLog(operationLog, currentUser, request, joinPoint, result, success, errorMsg, startTime);
            } catch (Exception logEx) {
                // 日志记录失败不应影响主业务流程
                log.error("[操作日志记录失败]", logEx);
            }
        }

        return result;
    }

    /**
     * 保存日志到数据库
     */
    private void saveLog(OperationLog operationLog, LoginUser currentUser,
                         HttpServletRequest request, ProceedingJoinPoint joinPoint,
                         Object result, boolean success, String errorMsg, long startTime) throws Exception {
        LogEntity logEntity = new LogEntity();

        // 操作人信息
        if (currentUser != null) {
            logEntity.setOperatorType(currentUser.isAdmin() ? 1 : 2);
            logEntity.setOperatorId(currentUser.getUserId());
            logEntity.setOperatorName(currentUser.getRealName());
        } else {
            logEntity.setOperatorType(0);
            logEntity.setOperatorId(0L);
            logEntity.setOperatorName("匿名用户");
        }

        // 操作信息
        logEntity.setOperationModule(operationLog.module());
        logEntity.setOperationType(operationLog.type());
        logEntity.setOperationDesc(operationLog.desc());

        // 请求参数（支持脱敏，目前简单序列化）
        if (operationLog.recordParams() && joinPoint.getArgs().length > 0) {
            try {
                logEntity.setRequestParams(objectMapper.writeValueAsString(joinPoint.getArgs()));
            } catch (Exception e) {
                logEntity.setRequestParams("参数序列化失败");
            }
        }

        // 响应结果
        if (operationLog.recordResult()) {
            try {
                logEntity.setResponseResult(success ? objectMapper.writeValueAsString(result) : errorMsg);
            } catch (Exception e) {
                logEntity.setResponseResult("结果序列化失败");
            }
        }

        // HTTP 信息
        if (request != null) {
            logEntity.setIpAddress(getClientIp(request));
            logEntity.setUserAgent(request.getHeader("User-Agent"));
        }

        logEntity.setCreatedAt(LocalDateTime.now());

        // 保存到数据库
        // TODO: 高并发场景建议改为异步线程池写入，避免阻塞主线程
        logMapper.insert(logEntity);
    }

    /**
     * 从 SecurityContext 获取当前登录用户
     */
    private LoginUser getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof LoginUser) {
            return (LoginUser) authentication.getPrincipal();
        }
        return null;
    }

    /**
     * 获取当前 HTTP 请求
     */
    private HttpServletRequest getRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes != null ? attributes.getRequest() : null;
    }

    /**
     * 获取客户端真实 IP（考虑反向代理）
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // 多个 IP 时取第一个
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
