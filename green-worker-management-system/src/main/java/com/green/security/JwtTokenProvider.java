package com.green.security;

import com.green.common.constants.SystemConstants;
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
 * <p>负责 JWT 的生成、解析和校验。</p>
 * <p>系统存在两种身份（管理员、司机），Token 中通过 {@code role} 字段区分。</p>
 *
 * <h3>Token 结构（Payload）</h3>
 * <pre>
 * {
 *   "sub": "用户名/手机号",
 *   "userId": 10001,
 *   "role": "ADMIN",
 *   "realName": "张三",
 *   "iat": 1717491600,
 *   "exp": 1717578000
 * }
 * </pre>
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
     * Token 有效期（毫秒），默认 24 小时
     */
    @Value("${jwt.expiration:86400000}")
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
        claims.put("role", loginUser.getRole().getCode());
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
     * 从 Token 中提取角色
     */
    public String getRoleFromToken(String token) {
        return (String) parseToken(token).get("role");
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
     * 判断 Token 是否即将过期（预留方法，用于自动刷新 Token 场景）
     *
     * @param token     JWT 字符串
     * @param threshold 提前阈值（毫秒）
     * @return true = 即将过期
     */
    public boolean isTokenExpiringSoon(String token, long threshold) {
        Date expiration = parseToken(token).getExpiration();
        return expiration.getTime() - System.currentTimeMillis() < threshold;
    }

    /**
     * 获取 Token 在 Redis 中的缓存键
     *
     * @param role    角色代码（ADMIN / DRIVER）
     * @param userId  用户ID
     * @return Redis Key
     */
    public String getTokenRedisKey(String role, Long userId) {
        if (SystemConstants.ROLE_ADMIN.equalsIgnoreCase(role)) {
            return SystemConstants.ADMIN_TOKEN_KEY_PREFIX + userId;
        }
        return SystemConstants.DRIVER_TOKEN_KEY_PREFIX + userId;
    }

    /**
     * 获取签名密钥对象
     */
    private SecretKey getSignKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
