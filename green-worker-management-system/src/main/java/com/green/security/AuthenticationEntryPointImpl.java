package com.green.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.green.common.result.ApiResult;
import com.green.common.result.ResultCodeEnum;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * 认证失败入口点
 *
 * <p>当未登录用户访问受保护接口时触发，返回标准化的 JSON 错误响应。</p>
 * <p>替代 Spring Security 默认的跳转到登录页行为（前后端分离场景不需要页面跳转）。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AuthenticationEntryPointImpl implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {
        log.warn("[认证失败] URI={} | Message={}", request.getRequestURI(), authException.getMessage());

        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(HttpServletResponse.SC_OK);

        ApiResult<Void> result = ApiResult.error(ResultCodeEnum.UNAUTHORIZED);
        response.getWriter().write(objectMapper.writeValueAsString(result));
    }
}
