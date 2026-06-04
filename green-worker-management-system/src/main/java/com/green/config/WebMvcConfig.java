package com.green.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC 配置类
 *
 * <p>配置跨域访问（CORS），允许前端（Next.js 管理后台、微信小程序）调用后端接口。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    /**
     * 配置跨域映射
     * <p>开发环境允许所有来源，生产环境应限制为具体域名。</p>
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                // 允许的请求来源（生产环境请改为具体域名）
                .allowedOriginPatterns("*")
                // 允许的请求方法
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                // 允许的请求头
                .allowedHeaders("*")
                // 允许携带凭证（如 Cookie、Authorization Header）
                .allowCredentials(true)
                // 预检请求缓存时间（秒）
                .maxAge(3600);
    }
}
