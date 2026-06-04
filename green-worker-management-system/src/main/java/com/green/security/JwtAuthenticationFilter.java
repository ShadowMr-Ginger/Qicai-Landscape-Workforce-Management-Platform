package com.green.security;

import com.green.common.constants.SystemConstants;
import com.green.common.enums.RoleEnum;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * JWT 认证过滤器
 *
 * <p>拦截每个请求，从请求头中提取 Token 并校验，将认证信息写入 SecurityContext。</p>
 * <p>继承 {@link OncePerRequestFilter} 确保每个请求只过滤一次。</p>
 *
 * <h3>认证流程</h3>
 * <ol>
 *     <li>从请求头 {@code Authorization} 中提取 Token</li>
 *     <li>解析 Token 获取 userId 和 role</li>
 *     <li>到 Redis 中校验 Token 是否有效（支持后端强制登出）</li>
 *     <li>构建 {@link LoginUser} 并写入 SecurityContext</li>
 * </ol>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final RedisTemplate<String, Object> redisTemplate;

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
            String roleCode = (String) claims.get("role");
            String username = claims.getSubject();
            String realName = (String) claims.get("realName");
            Boolean passwordChanged = (Boolean) claims.get("passwordChanged");

            // 3. Redis 校验：判断该 Token 是否仍有效（支持后端强制登出）
            String redisKey = jwtTokenProvider.getTokenRedisKey(roleCode, userId);
            String storedToken = (String) redisTemplate.opsForValue().get(redisKey);

            if (token.equals(storedToken)) {
                // 4. 构建 LoginUser 并设置到 SecurityContext
                RoleEnum role = RoleEnum.fromCode(roleCode);
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
            } else {
                log.warn("Token 与 Redis 中存储的不一致，可能已被强制登出 | userId={}", userId);
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
