package com.green.module.group.vo;

import lombok.Data;

/**
 * 组别列表 VO
 */
@Data
public class GroupListVO {

    private Long id;

    private String groupName;

    private String description;

    private Integer isSystem;

    private Integer workerCount;

    private Integer resignedWorkerCount;
}
