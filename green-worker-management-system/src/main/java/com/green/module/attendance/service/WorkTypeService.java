package com.green.module.attendance.service;

import com.green.module.attendance.entity.WorkTypeEntity;

import java.util.List;

/**
 * 作业类型服务接口
 */
public interface WorkTypeService {

    List<WorkTypeEntity> listAll();

    Long create(String typeName, String description);

    void update(Long id, String typeName, String description);

    void delete(Long id);
}
