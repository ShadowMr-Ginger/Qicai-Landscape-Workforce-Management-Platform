package com.green.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security 配置类
 *
 * <p>配置安全策略：无状态会话、JWT 认证、密码加密、接口权限控制。</p>
 * <p>本系统用户规模极小，安全策略以"够用即可"为原则，不引入复杂 RBAC。</p>
 *
 * <h3>核心配置说明</h3>
 * <ul>
 *     <li>无 Session：采用 JWT 无状态认证，不创建 HTTP Session</li>
 *     <li>CSRF 禁用：前后端分离 + Token 认证，无需 CSRF 防护</li>
 *     <li>方法级权限：通过 {@code @PreAuthorize("hasRole('ADMIN')")} 控制接口访问</li>
 *     <li>登录接口放行：/api/auth/admin/login 和 /api/auth/driver/login 无需认证</li>
 * </ul>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AuthenticationEntryPoint authenticationEntryPoint;
    private final UserDetailsServiceImpl userDetailsService;

    /**
     * 配置 HTTP 安全过滤器链
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 禁用 CSRF（前后端分离 + JWT 无 Cookie 场景）
                .csrf(AbstractHttpConfigurer::disable)

                // 配置无状态会话（不创建 Session）
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 配置异常处理：认证失败时返回 JSON，不跳转到登录页
                .exceptionHandling(exception ->
                        exception.authenticationEntryPoint(authenticationEntryPoint))

                // 配置接口访问权限
                .authorizeHttpRequests(auth -> auth
                        // OPTIONS 预检请求放行（CORS 需要）
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // 公开接口：管理员登录、司机登录、接口文档
                        .requestMatchers("/api/auth/admin/login").permitAll()
                        .requestMatchers("/api/auth/driver/login").permitAll()
                        .requestMatchers("/doc.html", "/webjars/**", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .requestMatchers("/favicon.ico").permitAll()
                        // 其他所有请求需要认证
                        .anyRequest().authenticated()
                )

                // 添加 JWT 认证过滤器（放在 UsernamePasswordAuthenticationFilter 之前）
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * 密码编码器：BCrypt
     * <p>管理员和司机的密码统一使用 BCrypt 加密存储</p>
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * 认证管理器
     * <p>用于登录接口手动触发认证流程</p>
     */
    @Bean
    public AuthenticationManager authenticationManager() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return new ProviderManager(provider);
    }
}
