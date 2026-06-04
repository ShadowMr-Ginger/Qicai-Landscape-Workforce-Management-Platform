package com.green.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT Token 提供者
 *
 * <p>负责 JWT 的生成、解析和校验。本系统用户规模极小（管理员1~2人，司机约10人），
 * 因此采用极简设计：不使用 Redis 存储 Token，仅靠 JWT 自包含信息完成认证。</p>
 *
 * <h3>Token 结构（Payload）</h3>
 * <pre>
 * {
 *   "sub": "用户名/姓名",
 *   "userId": 10001,
 *   "userType": "ADMIN",
 *   "realName": "张三",
 *   "passwordChanged": true,
 *   "iat": 1717491600,
 *   "exp": 1718096400
 * }
 * </pre>
 *
 * <h3>设计原因</h3>
 * <ul>
 *     <li>无 Redis：系统用户极少，无需分布式会话，JWT 自解析即可</li>
 *     <li>7 天有效期：司机使用小程序频率较低，减少频繁登录</li>
 *     <li>Token 中包含 passwordChanged：首次登录校验无需再查数据库</li>
 * </ul>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Slf4j
@Component
public class JwtTokenProvider {

    /**
     * JWT 签名密钥（从配置文件读取，Base64 编码）
     */
    @Value("${jwt.secret}")
    private String jwtSecret;

    /**
     * Token 有效期（毫秒），默认 7 天
     * <p>计算：7 * 24 * 60 * 60 * 1000 = 604800000</p>
     */
    @Value("${jwt.expiration:604800000}")
    private long jwtExpiration;

    /**
     * 生成 JWT Token
     *
     * @param loginUser 登录用户对象
     * @return JWT 字符串
     */
    public String generateToken(LoginUser loginUser) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", loginUser.getUserId());
        claims.put("userType", loginUser.getRole().getCode());
        claims.put("realName", loginUser.getRealName());
        claims.put("passwordChanged", loginUser.getPasswordChanged());

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);

        return Jwts.builder()
                .claims(claims)
                .subject(loginUser.getUsername())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSignKey())
                .compact();
    }

    /**
     * 从 Token 中解析 Claims
     *
     * @param token JWT 字符串
     * @return Claims 对象
     */
    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(getSignKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * 从 Token 中提取用户名（Subject）
     */
    public String getUsernameFromToken(String token) {
        return parseToken(token).getSubject();
    }

    /**
     * 从 Token 中提取用户ID
     */
    public Long getUserIdFromToken(String token) {
        Object userId = parseToken(token).get("userId");
        return userId != null ? Long.valueOf(userId.toString()) : null;
    }

    /**
     * 从 Token 中提取用户类型（ADMIN / DRIVER）
     */
    public String getUserTypeFromToken(String token) {
        return (String) parseToken(token).get("userType");
    }

    /**
     * 从 Token 中提取是否已修改密码
     */
    public Boolean getPasswordChangedFromToken(String token) {
        Object value = parseToken(token).get("passwordChanged");
        return value != null ? Boolean.valueOf(value.toString()) : true;
    }

    /**
     * 校验 Token 是否有效（未过期且签名正确）
     *
     * @param token JWT 字符串
     * @return true = 有效
     */
    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (Exception e) {
            log.warn("JWT 校验失败: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 获取签名密钥对象
     */
    private SecretKey getSignKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
