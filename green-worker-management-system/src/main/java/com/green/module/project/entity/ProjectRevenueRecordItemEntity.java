package com.green.module.project.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * 项目营业记录明细实体
 */
@Data
@TableName("project_revenue_record_items")
public class ProjectRevenueRecordItemEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    /** 主键ID */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /** 所属营业记录ID */
    private Long recordId;

    /** 服务名称 */
    private String serviceName;

    /** 工人类型: 1-男工, 2-女工 */
    private Integer workerType;

    /** 数量 */
    private Integer quantity;

    /** 单价 */
    private BigDecimal unitPrice;

    /** 总价 */
    private BigDecimal totalPrice;

    /** 备注 */
    private String remark;
}
