package com.green.module.worker.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.green.module.worker.dto.UpdateWorkerDTO;
import com.green.module.worker.dto.WorkerQuery;
import com.green.module.worker.vo.WorkerDetailVO;
import com.green.module.worker.vo.WorkerListVO;

/**
 * 工人服务接口
 *
 * @author Green Team
 * @version 1.0.0
 */
public interface WorkerService {

    /**
     * 分页查询工人列表
     *
     * @param query 查询参数
     * @return 分页结果
     */
    IPage<WorkerListVO> list(WorkerQuery query);

    /**
     * 查询工人详情
     *
     * @param id 工人ID
     * @return 详情信息
     */
    WorkerDetailVO detail(Long id);

    /**
     * 修改工人信息
     *
     * @param id  工人ID
     * @param dto 修改参数
     */
    void update(Long id, UpdateWorkerDTO dto);

    /**
     * 工人离职
     *
     * <p>将工人状态更新为离职（isEmployed = 0），不删除数据。</p>
     *
     * @param id 工人ID
     */
    void resign(Long id);

    /**
     * 删除工人
     *
     * <p>物理删除工人，同时级联删除关联的考勤记录。</p>
     *
     * @param id 工人ID
     * @return 关联考勤记录数量（用于警告提示）
     */
    int deleteWorker(Long id);
}
