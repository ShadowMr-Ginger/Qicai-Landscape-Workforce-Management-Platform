package com.green.common.base;

import lombok.Data;

/**
 * 基础查询参数
 *
 * <p>所有列表查询请求DTO统一继承此类，提供分页参数。</p>
 * <p>默认页码为第1页，每页10条记录。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Data
public class BaseQuery {

    /**
     * 当前页码，从1开始
     */
    private Integer pageNum = 1;

    /**
     * 每页记录数，默认10条，最大500条（防止恶意大批量查询）
     */
    private Integer pageSize = 10;

    /**
     * 获取 MyBatis-Plus 分页对象使用的当前页（内部转换为从0开始）
     */
    public long getCurrent() {
        return this.pageNum != null && this.pageNum > 0 ? this.pageNum : 1;
    }

    /**
     * 获取安全的每页记录数
     */
    public long getSize() {
        if (this.pageSize == null || this.pageSize < 1) {
            return 10;
        }
        // 限制最大查询条数，防止拖垮数据库
        return Math.min(this.pageSize, 500);
    }
}
