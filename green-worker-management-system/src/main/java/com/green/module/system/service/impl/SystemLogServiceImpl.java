package com.green.module.system.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.green.module.system.entity.SystemLogEntity;
import com.green.module.system.mapper.SystemLogMapper;
import com.green.module.system.service.SystemLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 系统日志服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SystemLogServiceImpl implements SystemLogService {

    private final SystemLogMapper systemLogMapper;

    @Override
    public void log(String userType, Long userId, String userName, String action,
                    String targetType, Long targetId, String detail) {
        log(userType, userId, userName, action, targetType, targetId, detail, null, null);
    }

    @Override
    public void log(String userType, Long userId, String userName, String action,
                    String targetType, Long targetId, String detail, String ipAddress, String result) {
        try {
            SystemLogEntity entity = new SystemLogEntity();
            entity.setUserType(userType);
            entity.setUserId(userId);
            entity.setUserName(userName);
            entity.setAction(action);
            entity.setTargetType(targetType);
            entity.setTargetId(targetId);
            entity.setDetail(detail);
            entity.setIpAddress(ipAddress);
            entity.setResult(result);
            systemLogMapper.insert(entity);
        } catch (Exception e) {
            log.error("记录系统日志失败", e);
        }
    }

    @Override
    public IPage<SystemLogEntity> listLogs(int pageNum, int pageSize, String userType, String action) {
        Page<SystemLogEntity> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<SystemLogEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(SystemLogEntity::getCreateTime);
        if (StringUtils.hasText(userType)) {
            wrapper.eq(SystemLogEntity::getUserType, userType);
        }
        if (StringUtils.hasText(action)) {
            wrapper.like(SystemLogEntity::getAction, action);
        }
        return systemLogMapper.selectPage(page, wrapper);
    }
}
