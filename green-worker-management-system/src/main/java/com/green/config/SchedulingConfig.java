package com.green.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 定时任务配置
 * <p>
 * 启用 Spring 的定时任务调度能力，用于数据库自动备份等任务。
 */
@Configuration
@EnableScheduling
@EnableAsync
public class SchedulingConfig {
}
