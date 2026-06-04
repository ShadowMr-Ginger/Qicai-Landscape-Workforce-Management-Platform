package com.green.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Redis 配置类
 *
 * <p>配置 RedisTemplate 的序列化方式，解决默认 JDK 序列化导致的可读性差和跨语言问题。</p>
 * <p>采用 JSON 序列化保存对象，键使用 String 序列化。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Configuration
public class RedisConfig {

    /**
     * 配置 RedisTemplate
     * <p>键序列化：StringRedisSerializer</p>
     * <p>值序列化：GenericJackson2JsonRedisSerializer（带类型信息，支持反序列化）</p>
     *
     * @param connectionFactory Redis 连接工厂
     * @return 配置好的 RedisTemplate
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // 键的序列化方式：字符串
        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);

        // 值的序列化方式：JSON（带 @class 类型信息，确保反序列化时能正确恢复对象类型）
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );
        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer(objectMapper);
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);

        template.afterPropertiesSet();
        return template;
    }
}
