package com.green.module.project.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.green.common.exception.BusinessException;
import com.green.common.result.ResultCodeEnum;
import com.green.module.ledger.service.LedgerService;
import com.green.module.ledger.vo.LedgerVO;
import com.green.module.project.entity.CommonServiceNameEntity;
import com.green.module.project.entity.ProjectCommonServiceEntity;
import com.green.module.project.entity.ProjectEntity;
import com.green.module.project.mapper.CommonServiceNameMapper;
import com.green.module.project.mapper.ProjectCommonServiceMapper;
import com.green.module.project.mapper.ProjectMapper;
import com.green.module.project.service.ProjectRevenueService;
import com.green.module.project.util.RevenueRecordExportUtil;
import com.green.module.project.vo.RevenueRecordVO;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 项目营业记录（台账投影）与常用服务名称服务实现
 */
@Service
@RequiredArgsConstructor
public class ProjectRevenueServiceImpl implements ProjectRevenueService {

    private final LedgerService ledgerService;
    private final CommonServiceNameMapper commonServiceNameMapper;
    private final ProjectCommonServiceMapper projectCommonServiceMapper;
    private final ProjectMapper projectMapper;

    @Override
    public List<RevenueRecordVO> listByProject(Long projectId) {
        List<LedgerVO> ledgers = ledgerService.listByProject(projectId);
        return ledgers.stream().map(this::convertToVO).collect(Collectors.toList());
    }

    @Override
    public RevenueRecordVO detail(Long recordId) {
        return convertToVO(ledgerService.detail(recordId));
    }

    @Override
    public void exportRecords(Long projectId, LocalDate startDate, LocalDate endDate,
                              String format, HttpServletResponse response) throws IOException {
        ProjectEntity project = projectMapper.selectById(projectId);
        String projectName = project == null ? "" : project.getProjectName();

        List<LedgerVO> ledgers = ledgerService.listByProjectAndDateRange(projectId, startDate, endDate);
        List<RevenueRecordVO> records = ledgers.stream().map(this::convertToVO).collect(Collectors.toList());

        boolean isExcel = "excel".equalsIgnoreCase(format);
        String title = startDate.format(DateTimeFormatter.ofPattern("yyyy.MM.dd")) + "~"
                + endDate.format(DateTimeFormatter.ofPattern("yyyy.MM.dd")) + " - "
                + projectName + " - 绿化用工";
        String encodedName = URLEncoder.encode(title + (isExcel ? ".xlsx" : ".docx"), StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20")
                .replace("%7E", "~")
                .replace("%2D", "-")
                .replace("%5F", "_")
                .replace("%2E", ".");
        response.setContentType(isExcel
                ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                : "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + encodedName + "\"; filename*=UTF-8''" + encodedName);

        try (OutputStream out = response.getOutputStream()) {
            if (isExcel) {
                RevenueRecordExportUtil.exportExcel(records, projectName, startDate, endDate, out);
            } else {
                RevenueRecordExportUtil.exportWord(records, projectName, startDate, endDate, out);
            }
            out.flush();
        }
    }

    @Override
    public List<CommonServiceNameEntity> listCommonServiceNames() {
        return commonServiceNameMapper.selectList(
            new QueryWrapper<CommonServiceNameEntity>()
                .eq("deleted", 0)
                .orderByDesc("create_time")
        );
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createCommonServiceName(String serviceName, BigDecimal basePrice) {
        if (serviceName == null || serviceName.trim().isEmpty()) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "服务名称不能为空");
        }
        if (basePrice != null && basePrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "基础价格不能为负数");
        }
        CommonServiceNameEntity entity = new CommonServiceNameEntity();
        entity.setServiceName(serviceName.trim());
        entity.setBasePrice(basePrice);
        entity.setIsSystem(0);
        commonServiceNameMapper.insert(entity);
        return entity.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateCommonServiceName(Long id, String serviceName, BigDecimal basePrice) {
        CommonServiceNameEntity entity = commonServiceNameMapper.selectById(id);
        if (entity == null || entity.getDeleted() == 1) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "服务名称不存在");
        }
        if (entity.getIsSystem() != null && entity.getIsSystem() == 1) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "系统预设服务名称不可修改");
        }
        if (serviceName == null || serviceName.trim().isEmpty()) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "服务名称不能为空");
        }
        if (basePrice != null && basePrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "基础价格不能为负数");
        }
        entity.setServiceName(serviceName.trim());
        entity.setBasePrice(basePrice);
        commonServiceNameMapper.updateById(entity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteCommonServiceName(Long id) {
        CommonServiceNameEntity entity = commonServiceNameMapper.selectById(id);
        if (entity == null || entity.getDeleted() == 1) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "服务名称不存在");
        }
        if (entity.getIsSystem() != null && entity.getIsSystem() == 1) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "系统预设服务名称不可删除");
        }
        commonServiceNameMapper.deleteById(id);
    }

    // ==================== 项目内常用服务 ====================

    @Override
    public List<ProjectCommonServiceEntity> listProjectCommonServices(Long projectId) {
        return projectCommonServiceMapper.selectList(
            new QueryWrapper<ProjectCommonServiceEntity>()
                .eq("project_id", projectId)
                .eq("deleted", 0)
                .orderByAsc("service_name")
        );
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createProjectCommonService(Long projectId, String serviceName, Integer workerType, BigDecimal unitPrice) {
        if (serviceName == null || serviceName.trim().isEmpty()) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "服务名称不能为空");
        }
        if (unitPrice == null || unitPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "单价不能为负数");
        }
        ProjectCommonServiceEntity entity = new ProjectCommonServiceEntity();
        entity.setProjectId(projectId);
        entity.setServiceName(serviceName.trim());
        entity.setWorkerType(workerType);
        entity.setUnitPrice(unitPrice);
        projectCommonServiceMapper.insert(entity);
        return entity.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateProjectCommonService(Long id, String serviceName, Integer workerType, BigDecimal unitPrice) {
        ProjectCommonServiceEntity entity = projectCommonServiceMapper.selectById(id);
        if (entity == null || entity.getDeleted() == 1) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "项目内常用服务不存在");
        }
        if (serviceName == null || serviceName.trim().isEmpty()) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "服务名称不能为空");
        }
        if (unitPrice == null || unitPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "单价不能为负数");
        }
        entity.setServiceName(serviceName.trim());
        entity.setWorkerType(workerType);
        entity.setUnitPrice(unitPrice);
        projectCommonServiceMapper.updateById(entity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteProjectCommonService(Long id) {
        ProjectCommonServiceEntity entity = projectCommonServiceMapper.selectById(id);
        if (entity == null || entity.getDeleted() == 1) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "项目内常用服务不存在");
        }
        projectCommonServiceMapper.deleteById(id);
    }

    private RevenueRecordVO convertToVO(LedgerVO ledger) {
        RevenueRecordVO vo = new RevenueRecordVO();
        vo.setId(ledger.getId());
        vo.setProjectId(ledger.getProjectId());
        vo.setRecordDate(ledger.getRecordDate());
        vo.setTotalAmount(ledger.getTotalAmount());
        vo.setRemark(null);
        vo.setCreateTime(ledger.getCreateTime());
        if (ledger.getItems() != null) {
            vo.setItems(ledger.getItems().stream().map(this::convertItemToVO).collect(Collectors.toList()));
        }
        return vo;
    }

    private RevenueRecordVO.RevenueRecordItemVO convertItemToVO(LedgerVO.LedgerItemVO item) {
        RevenueRecordVO.RevenueRecordItemVO vo = new RevenueRecordVO.RevenueRecordItemVO();
        vo.setId(item.getId());
        vo.setServiceName(item.getServiceName());
        vo.setWorkerType(item.getWorkerType());
        if (item.getWorkerType() == null) {
            vo.setWorkerTypeText("");
        } else {
            vo.setWorkerTypeText(item.getWorkerType() == 2 ? "女工" : "男工");
        }
        vo.setQuantity(item.getQuantity());
        vo.setUnitPrice(item.getUnitPrice());
        vo.setTotalPrice(item.getTotalPrice());
        vo.setRemark(null);
        return vo;
    }
}
