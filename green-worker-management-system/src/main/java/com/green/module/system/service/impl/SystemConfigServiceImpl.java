package com.green.module.system.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.green.module.system.entity.SystemConfigEntity;
import com.green.module.system.mapper.SystemConfigMapper;
import com.green.module.system.service.SystemConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 系统配置服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SystemConfigServiceImpl implements SystemConfigService {

    private final SystemConfigMapper systemConfigMapper;

    @Override
    public String getValue(String key) {
        return getValue(key, null);
    }

    @Override
    public String getValue(String key, String defaultValue) {
        SystemConfigEntity config = getByKey(key);
        return config != null ? config.getConfigValue() : defaultValue;
    }

    @Override
    public void setValue(String key, String value) {
        setValue(key, value, null);
    }

    @Override
    public void setValue(String key, String value, String description) {
        SystemConfigEntity existing = getByKey(key);
        if (existing != null) {
            existing.setConfigValue(value);
            if (description != null) {
                existing.setDescription(description);
            }
            systemConfigMapper.updateById(existing);
        } else {
            SystemConfigEntity config = new SystemConfigEntity();
            config.setConfigKey(key);
            config.setConfigValue(value);
            config.setDescription(description);
            systemConfigMapper.insert(config);
        }
    }

    @Override
    public SystemConfigEntity getByKey(String key) {
        LambdaQueryWrapper<SystemConfigEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SystemConfigEntity::getConfigKey, key);
        return systemConfigMapper.selectOne(wrapper);
    }
}
