package com.green.module.group.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 修改组别参数
 */
@Data
public class UpdateGroupDTO {

    @NotBlank(message = "组别名称不能为空")
    private String groupName;

    private String description;
}
