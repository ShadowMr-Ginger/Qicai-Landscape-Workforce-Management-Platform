package com.green;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 绿化工人管理系统 - 应用启动类
 *
 * <p>系统面向绿化工程行业，提供工人考勤、司机考勤、工资结算、项目管理等核心能力。</p>
 * <p>支撑端：Next.js 管理后台、微信小程序司机端、微信小程序管理员端</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
@SpringBootApplication
public class GreenWorkerManagementSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(GreenWorkerManagementSystemApplication.class, args);
    }
}
