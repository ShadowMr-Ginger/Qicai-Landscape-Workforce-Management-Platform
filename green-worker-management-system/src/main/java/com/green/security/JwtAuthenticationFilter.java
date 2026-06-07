package com.green.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.green.common.constants.SystemConstants;
import com.green.common.enums.RoleEnum;
import com.green.common.result.ApiResult;
import com.green.common.result.ResultCodeEnum;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JWT 认证过滤器
 *
 * <p>拦截每个请求，从请求头中提取 Token 并校验，将认证信息写入 SecurityContext。</p>
 * <p>本系统不使用 Redis，Token 有效性完全由 JWT 自身签名和过期时间保证。</p>
 *
 * <h3>认证流程</h3>
 * <ol>
 *     <li>从请求头 {@code Authorization} 中提取 Token</li>
 *     <li>解析 Token 获取 userId、userType、passwordChanged</li>
 *     <li>构建 {@link LoginUser} 并写入 SecurityContext</li>
 *     <li>若为司机且未修改默认密码，仅允许访问白名单接口</li>
 * </ol>
 *
 * <h3>司机首次登录限制</h3>
 * <p>司机首次登录后（passwordChanged = false），JWT 过滤器会拦截非白名单请求，
 * 返回错误码 1004，强制司机先修改密码。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final ObjectMapper objectMapper;

    /**
     * 司机首次登录时允许访问的白名单路径
     * <p>未修改密码前，司机只能访问这些接口</p>
     */
    private static final String[] DRIVER_PASSWORD_CHANGE_WHITELIST = {
            "/api/driver/change-password",
            "/api/driver/bind-wx",
            "/api/auth/current-user",
            "/api/auth/logout"
    };

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        // 1. 获取 Token
        String token = resolveToken(request);

        // 2. Token 存在且格式正确，进行认证
        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
            // 解析 Token 中的用户信息
            Claims claims = jwtTokenProvider.parseToken(token);
            Long userId = Long.valueOf(claims.get("userId").toString());
            String userType = (String) claims.get("userType");
            String username = claims.getSubject();
            String realName = (String) claims.get("realName");
            Boolean passwordChanged = jwtTokenProvider.getPasswordChangedFromToken(token);

            // 3. 构建 LoginUser 并设置到 SecurityContext
            RoleEnum role = RoleEnum.fromCode(userType);
            LoginUser loginUser = LoginUser.builder()
                    .userId(userId)
                    .username(username)
                    .realName(realName)
                    .role(role)
                    .passwordChanged(passwordChanged != null ? passwordChanged : true)
                    .enabled(true)
                    .build();

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            loginUser,
                            null,
                            loginUser.getAuthorities()
                    );
            authentication.setDetails(loginUser);
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // 4. 司机首次登录限制：未修改密码时，只允许访问白名单接口
            if (loginUser.isDriver() && Boolean.FALSE.equals(loginUser.getPasswordChanged())) {
                String requestUri = request.getRequestURI();
                boolean allowed = false;
                for (String whitePath : DRIVER_PASSWORD_CHANGE_WHITELIST) {
                    if (requestUri.equals(whitePath)) {
                        allowed = true;
                        break;
                    }
                }

                if (!allowed) {
                    log.warn("[首次登录拦截] 司机 {} 未修改默认密码，禁止访问: {}", realName, requestUri);
                    response.setContentType("application/json;charset=UTF-8");
                    response.setStatus(HttpServletResponse.SC_OK);
                    ApiResult<Void> result = ApiResult.error(ResultCodeEnum.PASSWORD_MUST_CHANGE);
                    response.getWriter().write(objectMapper.writeValueAsString(result));
                    return; // 中断过滤器链，不继续执行后续逻辑
                }
            }
        }

        // 继续过滤器链
        filterChain.doFilter(request, response);
    }

    /**
     * 从请求头中解析 Token
     *
     * @param request HTTP 请求
     * @return Token 字符串（去除 Bearer 前缀），若不存在返回 null
     */
    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader(SystemConstants.TOKEN_HEADER);
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(SystemConstants.TOKEN_PREFIX)) {
            return bearerToken.substring(SystemConstants.TOKEN_PREFIX.length());
        }
        return null;
    }
}
