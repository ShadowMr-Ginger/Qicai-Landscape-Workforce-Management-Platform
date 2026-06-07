package com.green.module.driver.service;

import com.green.module.worker.vo.WorkerListVO;

import java.util.List;

/**
 * 司机常用工人服务
 */
public interface DriverFavoriteWorkerService {

    /**
     * 获取司机的常用工人列表
     */
    List<WorkerListVO> listFavoriteWorkers(Long driverId);

    /**
     * 添加工人到常用列表
     */
    void addFavoriteWorker(Long driverId, Long workerId);

    /**
     * 从常用列表移除工人
     */
    void removeFavoriteWorker(Long driverId, Long workerId);

    /**
     * 搜索可添加的工人（排除已在常用列表的）
     */
    List<WorkerListVO> searchAvailableWorkers(Long driverId, String keyword);
}
