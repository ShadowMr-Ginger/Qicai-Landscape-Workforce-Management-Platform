package com.green.config;

import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.TimeZone;

/**
 * Jackson JSON 序列化配置
 *
 * <p>统一配置日期时间格式、时区、空值处理等，确保前后端 JSON 交互一致性。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Configuration
public class JacksonConfig {

    /**
     * 自定义 Jackson ObjectMapper
     * <p>解决 Java 8 日期时间（LocalDateTime）序列化问题，统一使用东八区时区。</p>
     */
    @Bean
    public Jackson2ObjectMapperBuilderCustomizer jacksonCustomizer() {
        return builder -> {
            // 注册 JavaTimeModule 支持 JDK8 日期/时间类型
            builder.modules(new JavaTimeModule());
            // 禁止将日期序列化为时间戳数组，统一格式化为字符串
            builder.featuresToDisable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
            // 设置默认时区为东八区（北京时间）
            builder.timeZone(TimeZone.getTimeZone("Asia/Shanghai"));
        };
    }
}
