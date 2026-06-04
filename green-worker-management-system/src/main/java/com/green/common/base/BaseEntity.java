package com.green.common.base;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.Version;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 基础实体类
 *
 * <p>所有核心业务表统一继承此类，包含通用审计字段和逻辑删除标识。</p>
 * <p>通过 MyBatis-Plus 的 {@link TableField} 注解实现字段自动填充。</p>
 *
 * <h3>逻辑删除方案说明</h3>
 * <ul>
 *     <li>deleted = 0：数据正常存在</li>
 *     <li>deleted = 1：数据已被逻辑删除</li>
 *     <li>所有查询默认过滤 deleted = 1 的记录（MyBatis-Plus 自动处理）</li>
 *     <li>物理删除仅在极端数据清理场景下使用</li>
 * </ul>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Data
public class BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键ID，采用数据库自增策略
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 创建时间
     * <p>插入时自动填充，不允许手动修改</p>
     */
    @TableField(fill = FieldFill.INSERT)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;

    /**
     * 更新时间
     * <p>插入和更新时自动填充</p>
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime;

    /**
     * 创建人ID
     * <p>插入时自动填充当前登录用户ID</p>
     */
    @TableField(fill = FieldFill.INSERT)
    private Long createBy;

    /**
     * 更新人ID
     * <p>插入和更新时自动填充当前登录用户ID</p>
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private Long updateBy;

    /**
     * 逻辑删除标志
     * <p>0 = 未删除，1 = 已删除</p>
     * <p>加了 {@link JsonIgnore}，防止序列化到前端</p>
     */
    @TableLogic
    @TableField(fill = FieldFill.INSERT)
    @JsonIgnore
    private Integer deleted;

    /**
     * 乐观锁版本号（预留）
     * <p>高并发场景下防止更新覆盖，当前业务数据量较小暂未强制使用</p>
     */
    @Version
    @TableField(fill = FieldFill.INSERT)
    @JsonIgnore
    private Integer version;
}
