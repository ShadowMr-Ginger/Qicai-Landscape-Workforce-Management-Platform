package com.green.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Knife4j / OpenAPI 文档配置
 *
 * <p>基于 OpenAPI 3 规范自动生成接口文档，通过 Knife4j 提供美观的 UI 界面。</p>
 * <p>访问地址：http://localhost:8080/doc.html</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Configuration
public class Knife4jConfig {

    /**
     * 配置 OpenAPI 基础信息
     */
    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("绿化工人管理系统 API 文档")
                        .description("面向绿化工程行业的工人与司机考勤、工资管理平台接口文档")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("Green Team")
                                .email("support@green.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0")));
    }
}
