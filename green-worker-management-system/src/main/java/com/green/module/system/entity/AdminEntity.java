package com.green.module.system.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.green.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 管理员实体类
 *
 * <p>对应数据库表 admins，存储系统管理员（老板/超级管理员）的账号信息。</p>
 *
 * <h3>设计原因</h3>
 * <p>系统仅 1~2 名管理员，功能极简，无需复杂角色体系。管理员通过账号密码登录后台，
 * 拥有最高权限（项目审核、工资结算、系统配置）。</p>
 *
 * <h3>使用场景</h3>
 * <ul>
 *     <li>管理员登录认证（/api/auth/admin/login）</li>
 *     <li>后台管理操作（审核批次、管理工人/司机、工资结算）</li>
 * </ul>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("admins")
public class AdminEntity extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 登录用户名
     * <p>全局唯一，用于管理员登录</p>
     */
    private String username;

    /**
     * 登录密码
     * <p>采用 BCrypt 加密存储，禁止明文保存</p>
     */
    private String password;

    /**
     * 真实姓名
     * <p>用于展示和管理</p>
     */
    private String realName;

    /**
     * 手机号
     * <p>预留联系方式字段</p>
     */
    private String phone;

    /**
     * 头像 URL
     * <p>管理员头像，可空</p>
     */
    private String avatar;

    /**
     * 角色类型
     * <p>1-超级管理员（当前系统仅支持此类型，预留扩展）</p>
     */
    private Integer roleType;

    /**
     * 是否启用
     * <p>1-启用，0-禁用。禁用后无法登录</p>
     */
    private Integer isActive;

    /**
     * 最后登录时间
     */
    private java.time.LocalDateTime lastLoginTime;

    /**
     * 最后登录 IP
     */
    private String lastLoginIp;
}
