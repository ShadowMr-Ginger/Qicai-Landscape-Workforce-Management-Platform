package com.green.module.driver.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.green.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

/**
 * 司机实体类
 *
 * <p>对应数据库表 drivers，存储司机的账号信息、薪资配置及微信绑定信息。</p>
 *
 * <h3>设计原因</h3>
 * <p>司机是小程序端的核心用户，约 10 人左右。司机通过"姓名+密码"登录小程序，
 * 首次登录后必须修改默认密码（123456），确保账号安全。</p>
 *
 * <h3>使用场景</h3>
 * <ul>
 *     <li>司机登录认证（/api/auth/driver/login）</li>
 *     <li>提交考勤批次、查看工资、管理常用工人</li>
 *     <li>管理员重置司机密码</li>
 * </ul>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("drivers")
public class DriverEntity extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 姓名
     * <p>用于司机登录（用户名），管理员端展示</p>
 */
    private String realName;

    /**
     * 手机号
     * <p>联系方式，预留字段</p>
     */
    private String phone;

    /**
     * 身份证号
     */
    private String idCard;

    /**
     * 紧急联系人电话
     */
    private String emergencyContactPhone;

    /**
     * 性别
     * <p>1-男，0-女</p>
     */
    private Integer gender;

    /**
     * 基础日薪（元）
     */
    private BigDecimal baseDailySalary;

    /**
     * 加班时薪（元/小时）
     */
    private BigDecimal overtimeHourlyRate;

    /**
     * 微信 OpenID
     * <p>预留字段，用于后续微信快捷登录绑定</p>
     */
    private String wxOpenid;

    /**
     * 微信 UnionID
     * <p>预留字段</p>
     */
    private String wxUnionid;

    /**
     * 登录密码
     * <p>默认 123456，采用 BCrypt 加密存储</p>
     */
    private String password;

    /**
     * 是否已修改默认密码
     * <p>0-未修改（首次登录必须修改），1-已修改</p>
     */
    private Integer passwordChanged;

    /**
     * 是否在职
     * <p>1-在职，0-离职。离职后无法登录</p>
     */
    private Integer isActive;
}
