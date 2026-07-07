package com.green.module.project.service;

import com.green.module.project.entity.CommonServiceNameEntity;
import com.green.module.project.entity.ProjectCommonServiceEntity;
import com.green.module.project.vo.RevenueRecordVO;

import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * 项目营业记录（台账投影）与常用服务名称服务接口
 */
public interface ProjectRevenueService {

    List<RevenueRecordVO> listByProject(Long projectId);

    RevenueRecordVO detail(Long recordId);

    void exportRecords(Long projectId, LocalDate startDate, LocalDate endDate, String format, HttpServletResponse response) throws IOException;

    List<CommonServiceNameEntity> listCommonServiceNames();

    Long createCommonServiceName(String serviceName, BigDecimal basePrice);

    void updateCommonServiceName(Long id, String serviceName, BigDecimal basePrice);

    void deleteCommonServiceName(Long id);

    List<ProjectCommonServiceEntity> listProjectCommonServices(Long projectId);

    Long createProjectCommonService(Long projectId, String serviceName, Integer workerType, BigDecimal unitPrice);

    void updateProjectCommonService(Long id, String serviceName, Integer workerType, BigDecimal unitPrice);

    void deleteProjectCommonService(Long id);
}
