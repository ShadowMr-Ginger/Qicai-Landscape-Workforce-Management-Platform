package com.green.module.project.service;

import com.green.module.project.dto.CreateRevenueRecordDTO;
import com.green.module.project.dto.UpdateRevenueRecordDTO;
import com.green.module.project.entity.CommonServiceNameEntity;
import com.green.module.project.vo.RevenueRecordVO;

import java.util.List;

/**
 * 项目营业记录与常用服务名称服务接口
 */
public interface ProjectRevenueService {

    List<RevenueRecordVO> listByProject(Long projectId);

    RevenueRecordVO detail(Long recordId);

    Long createRecord(CreateRevenueRecordDTO dto);

    void updateRecord(Long recordId, UpdateRevenueRecordDTO dto);

    void deleteRecord(Long recordId);

    List<CommonServiceNameEntity> listCommonServiceNames();

    Long createCommonServiceName(String serviceName);

    void deleteCommonServiceName(Long id);
}
