package com.green.module.system.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.green.module.system.entity.SystemLogEntity;
import com.green.security.LoginUser;
import com.green.utils.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;

/**
 * 系统日志服务
 */
public interface SystemLogService {

    /**
     * 记录日志（基础版）
     */
    void log(String userType, Long userId, String userName, String action,
             String targetType, Long targetId, String detail);

    /**
     * 记录日志（完整版）
     */
    void log(String userType, Long userId, String userName, String action,
             String targetType, Long targetId, String detail, String ipAddress, String result);

    /**
     * 便捷记录操作日志
     *
     * @param userId     用户ID
     * @param role       角色 ADMIN/DRIVER
     * @param actionType 操作类型 LOGIN/LOGOUT/CREATE/UPDATE/DELETE/SETTLE/REVIEW/OTHER
     * @param module     模块名称
     * @param content    操作内容描述
     * @param result     结果 SUCCESS/FAIL
     * @param request    HTTP请求（用于获取IP）
     */
    default void logAction(Long userId, String role, String actionType,
                           String module, String content, String result,
                           HttpServletRequest request) {
        logAction(userId, null, role, actionType, module, content, result, request);
    }

    default void logAction(Long userId, String userName, String role, String actionType,
                           String module, String content, String result,
                           HttpServletRequest request) {
        String ip = request != null ? getClientIp(request) : "";
        LoginUser currentUser = SecurityUtils.getCurrentUser();
        if (currentUser != null) {
            if (userName == null) {
                userName = currentUser.getRealName();
            }
            if (userId == null) {
                userId = currentUser.getUserId();
            }
        }
        log(role, userId, userName, actionType, module, null, content, ip, result);
    }

    /**
     * 获取客户端IP
     */
    default String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    /**
     * 分页查询日志
     */
    IPage<SystemLogEntity> listLogs(int pageNum, int pageSize, String userType, String action);
}
