package com.green.module.group.service;

import com.green.module.group.dto.CreateGroupDTO;
import com.green.module.group.dto.UpdateGroupDTO;
import com.green.module.group.vo.GroupListVO;
import com.green.module.group.vo.GroupWorkerVO;

import java.util.List;

/**
 * 组别服务接口
 */
public interface GroupService {

    /**
     * 新增组别
     */
    Long create(CreateGroupDTO dto);

    /**
     * 修改组别
     */
    void update(Long id, UpdateGroupDTO dto);

    /**
     * 删除组别（迁移工人到目标组）
     */
    void deleteGroup(Long id, Long targetGroupId);

    /**
     * 查询所有组别列表
     */
    List<GroupListVO> listAll();

    /**
     * 查询组别详情
     */
    GroupListVO detail(Long id);

    /**
     * 查询组内工人列表（含在职和离职）
     */
    List<GroupWorkerVO> listWorkers(Long groupId);

    /**
     * 将组内所有未离职工人设为离职
     */
    int resignAll(Long groupId);

    /**
     * 将组内所有离职工人恢复为在职
     */
    int restoreAll(Long groupId);
}
