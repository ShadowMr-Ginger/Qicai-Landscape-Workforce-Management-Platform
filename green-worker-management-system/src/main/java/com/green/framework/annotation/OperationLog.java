package com.green.framework.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 操作日志注解
 *
 * <p>标记在 Controller 方法上，通过 AOP 切面自动记录方法调用信息到 operation_logs 表。</p>
 *
 * <h3>使用示例</h3>
 * <pre>
 * &#64;OperationLog(module = "BATCH", type = "REVIEW", desc = "审核考勤批次")
 * &#64;PutMapping("/batches/{id}/review")
 * public ApiResult&lt;Void&gt; reviewBatch(...) { ... }
 * </pre>
 *
 * <h3>记录的日志内容</h3>
 * <ul>
 *     <li>操作人信息（从 SecurityContext 获取）</li>
 *     <li>操作模块、类型、描述</li>
 *     <li>请求参数（JSON 序列化，支持脱敏）</li>
 *     <li>操作结果（成功/失败）</li>
 *     <li>IP 地址、User-Agent</li>
 * </ul>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface OperationLog {

    /**
     * 操作模块
     * <p>建议取值：BATCH（批次）、WORKER（工人）、DRIVER（司机）、
     * WAGE（工资）、PROJECT（项目）、SYSTEM（系统）、AUTH（认证）</p>
     */
    String module();

    /**
     * 操作类型
     * <p>建议取值：CREATE（新增）、UPDATE（修改）、DELETE（删除）、
     * REVIEW（审核）、SETTLE（结清）、WITHDRAW（撤回）、LOGIN（登录）</p>
     */
    String type();

    /**
     * 操作描述
     * <p>支持 SpEL 表达式，例如：{@code "审核批次#{#request.batchId}"}</p>
     */
    String desc() default "";

    /**
     * 是否记录请求参数
     * <p>涉及敏感信息（如密码）的接口建议设为 false</p>
     */
    boolean recordParams() default true;

    /**
     * 是否记录响应结果
     */
    boolean recordResult() default true;
}
