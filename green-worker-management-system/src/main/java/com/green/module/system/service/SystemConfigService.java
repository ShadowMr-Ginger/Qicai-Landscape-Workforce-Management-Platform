package com.green.module.system.service;

import com.green.module.system.entity.SystemConfigEntity;

/**
 * 系统配置服务
 */
public interface SystemConfigService {

    String getValue(String key);

    String getValue(String key, String defaultValue);

    void setValue(String key, String value);

    void setValue(String key, String value, String description);

    SystemConfigEntity getByKey(String key);
}
