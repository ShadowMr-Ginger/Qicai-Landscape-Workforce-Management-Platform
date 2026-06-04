package com.green.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.OptimisticLockerInnerInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import lombok.extern.slf4j.Slf4j;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;

/**
 * MyBatis-Plus 配置类
 *
 * <p>配置分页插件、乐观锁插件、以及自动填充处理器。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Slf4j
@Configuration
public class MybatisPlusConfig {

    /**
     * MyBatis-Plus 插件集合
     * <p>注册分页插件（支持 MySQL 方言）</p>
     */
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        // 分页插件：指定数据库类型为 MySQL
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        // 乐观锁插件
        interceptor.addInnerInterceptor(new OptimisticLockerInnerInterceptor());
        return interceptor;
    }

    /**
     * 字段自动填充处理器
     * <p>实现 {@link MetaObjectHandler}，在插入和更新时自动填充审计字段。</p>
     * <p>createTime / updateTime / createBy / updateBy / deleted / version</p>
     */
    @Bean
    public MetaObjectHandler metaObjectHandler() {
        return new MetaObjectHandler() {

            @Override
            public void insertFill(MetaObject metaObject) {
                // 填充创建时间
                this.strictInsertFill(metaObject, "createTime", LocalDateTime.class, LocalDateTime.now());
                // 填充更新时间（插入时也算一次更新）
                this.strictInsertFill(metaObject, "updateTime", LocalDateTime.class, LocalDateTime.now());
                // 填充逻辑删除标志（默认未删除）
                this.strictInsertFill(metaObject, "deleted", Integer.class, 0);
                // 填充版本号（乐观锁初始值）
                this.strictInsertFill(metaObject, "version", Integer.class, 1);

                // 创建人和更新人需要结合 Security 上下文获取当前用户ID
                // 此处先填充默认值 0L，后续通过自定义逻辑覆盖
                this.strictInsertFill(metaObject, "createBy", Long.class, 0L);
                this.strictInsertFill(metaObject, "updateBy", Long.class, 0L);
            }

            @Override
            public void updateFill(MetaObject metaObject) {
                // 填充更新时间
                this.strictUpdateFill(metaObject, "updateTime", LocalDateTime.class, LocalDateTime.now());
                // 更新人同样需要结合 Security 上下文
                this.strictUpdateFill(metaObject, "updateBy", Long.class, 0L);
            }
        };
    }
}
