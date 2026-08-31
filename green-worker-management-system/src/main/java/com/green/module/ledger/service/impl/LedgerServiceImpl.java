package com.green.module.ledger.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.green.common.exception.BusinessException;
import com.green.common.result.ResultCodeEnum;
import com.green.module.ledger.dto.LedgerDTO;
import com.green.module.ledger.entity.LedgerEntity;
import com.green.module.ledger.entity.LedgerItemEntity;
import com.green.module.ledger.mapper.LedgerItemMapper;
import com.green.module.ledger.mapper.LedgerMapper;
import com.green.module.ledger.service.LedgerService;
import com.green.module.ledger.vo.LedgerVO;
import com.green.module.project.entity.ProjectCommonRemarkEntity;
import com.green.module.project.entity.ProjectCommonServiceEntity;
import com.green.module.project.entity.ProjectEntity;
import com.green.module.project.mapper.ProjectCommonRemarkMapper;
import com.green.module.project.mapper.ProjectCommonServiceMapper;
import com.green.module.project.mapper.ProjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.green.module.ledger.util.LedgerExportUtil;

import java.io.IOException;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 记录台账服务实现
 */
@Service
@RequiredArgsConstructor
public class LedgerServiceImpl implements LedgerService {

    private final LedgerMapper ledgerMapper;
    private final LedgerItemMapper ledgerItemMapper;
    private final ProjectMapper projectMapper;
    private final ProjectCommonServiceMapper projectCommonServiceMapper;
    private final ProjectCommonRemarkMapper projectCommonRemarkMapper;

    @Override
    public Page<LedgerVO> pageList(Long projectId, LocalDate startDate, LocalDate endDate,
                                   Integer pageNum, Integer pageSize) {
        Page<LedgerEntity> page = new Page<>(pageNum == null ? 1 : pageNum,
                pageSize == null ? 50 : pageSize);
        QueryWrapper<LedgerEntity> wrapper = new QueryWrapper<LedgerEntity>()
                .eq("deleted", 0)
                .orderByDesc("record_date", "create_time");
        if (projectId != null) {
            wrapper.eq("project_id", projectId);
        }
        if (startDate != null) {
            wrapper.ge("record_date", startDate);
        }
        if (endDate != null) {
            wrapper.le("record_date", endDate);
        }
        Page<LedgerEntity> entityPage = ledgerMapper.selectPage(page, wrapper);
        List<LedgerVO> records = entityPage.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
        Page<LedgerVO> result = new Page<>(entityPage.getCurrent(), entityPage.getSize(), entityPage.getTotal());
        result.setRecords(records);
        return result;
    }

    @Override
    public List<LedgerVO> listByProject(Long projectId) {
        List<LedgerEntity> entities = ledgerMapper.selectList(
                new QueryWrapper<LedgerEntity>()
                        .eq("project_id", projectId)
                        .eq("deleted", 0)
                        .orderByDesc("record_date", "create_time")
        );
        return entities.stream().map(this::convertToVO).collect(Collectors.toList());
    }

    @Override
    public List<LedgerVO> listByProjectAndDateRange(Long projectId, LocalDate startDate, LocalDate endDate) {
        QueryWrapper<LedgerEntity> wrapper = new QueryWrapper<LedgerEntity>()
                .eq("project_id", projectId)
                .eq("deleted", 0)
                .orderByDesc("record_date", "create_time");
        if (startDate != null) {
            wrapper.ge("record_date", startDate);
        }
        if (endDate != null) {
            wrapper.le("record_date", endDate);
        }
        return ledgerMapper.selectList(wrapper).stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    @Override
    public List<LedgerVO> listByDateRange(LocalDate startDate, LocalDate endDate) {
        QueryWrapper<LedgerEntity> wrapper = new QueryWrapper<LedgerEntity>()
                .eq("deleted", 0)
                .orderByAsc("record_date", "create_time");
        if (startDate != null) {
            wrapper.ge("record_date", startDate);
        }
        if (endDate != null) {
            wrapper.le("record_date", endDate);
        }
        return ledgerMapper.selectList(wrapper).stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    @Override
    public void exportLedgers(LocalDate startDate, LocalDate endDate, String format,
                              jakarta.servlet.http.HttpServletResponse response) throws IOException {
        List<LedgerVO> records = listByDateRange(startDate, endDate);
        String ext;
        String mimeType;
        if ("excel".equalsIgnoreCase(format)) {
            ext = ".xlsx";
            mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        } else if ("pdf".equalsIgnoreCase(format)) {
            ext = ".pdf";
            mimeType = "application/pdf";
        } else {
            ext = ".docx";
            mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }
        String title = startDate.format(DateTimeFormatter.ofPattern("yyyy.MM.dd")) + "~"
                + endDate.format(DateTimeFormatter.ofPattern("yyyy.MM.dd")) + " - 台账导出";
        String encodedName = URLEncoder.encode(title + ext, StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20")
                .replace("%7E", "~")
                .replace("%2D", "-")
                .replace("%5F", "_")
                .replace("%2E", ".");
        response.setContentType(mimeType);
        response.setHeader("Content-Disposition", "attachment; filename=\"" + encodedName + "\"; filename*=UTF-8''" + encodedName);

        try (OutputStream out = response.getOutputStream()) {
            if ("excel".equalsIgnoreCase(format)) {
                LedgerExportUtil.exportExcel(records, startDate, endDate, out);
            } else if ("pdf".equalsIgnoreCase(format)) {
                LedgerExportUtil.exportPdf(records, startDate, endDate, out);
            } else {
                LedgerExportUtil.exportWord(records, startDate, endDate, out);
            }
            out.flush();
        }
    }

    @Override
    public LedgerVO detail(Long id) {
        LedgerEntity entity = ledgerMapper.selectById(id);
        if (entity == null || entity.getDeleted() == 1) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "台账记录不存在");
        }
        return convertToVO(entity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long create(LedgerDTO dto) {
        validateProject(dto.getProjectId());

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<LedgerItemEntity> itemEntities = new ArrayList<>();
        int sortOrder = 0;
        for (LedgerDTO.LedgerItemDTO item : dto.getItems()) {
            BigDecimal totalPrice = BigDecimal.valueOf(item.getQuantity())
                    .multiply(item.getUnitPrice())
                    .setScale(2, RoundingMode.HALF_UP);
            LedgerItemEntity entity = new LedgerItemEntity();
            entity.setServiceName(item.getServiceName());
            entity.setWorkerType(item.getWorkerType());
            entity.setQuantity(item.getQuantity());
            entity.setUnitPrice(item.getUnitPrice());
            entity.setTotalPrice(totalPrice);
            entity.setRemark(item.getRemark());
            entity.setSortOrder(sortOrder++);
            itemEntities.add(entity);
            totalAmount = totalAmount.add(totalPrice);
        }

        LedgerEntity ledger = new LedgerEntity();
        ledger.setProjectId(dto.getProjectId());
        ledger.setRecordDate(dto.getRecordDate());
        ledger.setTotalAmount(totalAmount);
        ledgerMapper.insert(ledger);

        for (LedgerItemEntity item : itemEntities) {
            item.setLedgerId(ledger.getId());
            ledgerItemMapper.insert(item);
            ensureProjectCommonService(ledger.getProjectId(), item.getServiceName(),
                    item.getWorkerType(), item.getUnitPrice());
            ensureProjectCommonRemark(ledger.getProjectId(), item.getRemark());
        }

        return ledger.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(Long id, LedgerDTO dto) {
        LedgerEntity ledger = ledgerMapper.selectById(id);
        if (ledger == null || ledger.getDeleted() == 1) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "台账记录不存在");
        }
        validateProject(dto.getProjectId());

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<LedgerItemEntity> itemEntities = new ArrayList<>();
        int sortOrder = 0;
        for (LedgerDTO.LedgerItemDTO item : dto.getItems()) {
            BigDecimal totalPrice = BigDecimal.valueOf(item.getQuantity())
                    .multiply(item.getUnitPrice())
                    .setScale(2, RoundingMode.HALF_UP);
            LedgerItemEntity entity = new LedgerItemEntity();
            entity.setServiceName(item.getServiceName());
            entity.setWorkerType(item.getWorkerType());
            entity.setQuantity(item.getQuantity());
            entity.setUnitPrice(item.getUnitPrice());
            entity.setTotalPrice(totalPrice);
            entity.setRemark(item.getRemark());
            entity.setSortOrder(sortOrder++);
            itemEntities.add(entity);
            totalAmount = totalAmount.add(totalPrice);
        }

        ledger.setProjectId(dto.getProjectId());
        ledger.setRecordDate(dto.getRecordDate());
        ledger.setTotalAmount(totalAmount);
        ledgerMapper.updateById(ledger);

        ledgerItemMapper.delete(
                new QueryWrapper<LedgerItemEntity>().eq("ledger_id", id)
        );

        for (LedgerItemEntity item : itemEntities) {
            item.setLedgerId(id);
            ledgerItemMapper.insert(item);
            ensureProjectCommonService(ledger.getProjectId(), item.getServiceName(),
                    item.getWorkerType(), item.getUnitPrice());
            ensureProjectCommonRemark(ledger.getProjectId(), item.getRemark());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        LedgerEntity ledger = ledgerMapper.selectById(id);
        if (ledger == null || ledger.getDeleted() == 1) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "台账记录不存在");
        }
        ledgerMapper.deleteById(id);
        ledgerItemMapper.delete(
                new QueryWrapper<LedgerItemEntity>().eq("ledger_id", id)
        );
    }

    private void validateProject(Long projectId) {
        ProjectEntity project = projectMapper.selectById(projectId);
        if (project == null || project.getDeleted() == 1) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "项目不存在");
        }
    }

    private void ensureProjectCommonRemark(Long projectId, String remarkName) {
        if (!StringUtils.hasText(remarkName)) {
            return;
        }
        long count = projectCommonRemarkMapper.selectCount(
                new QueryWrapper<ProjectCommonRemarkEntity>()
                        .eq("project_id", projectId)
                        .eq("remark_name", remarkName.trim())
                        .eq("deleted", 0)
        );
        if (count == 0) {
            ProjectCommonRemarkEntity entity = new ProjectCommonRemarkEntity();
            entity.setProjectId(projectId);
            entity.setRemarkName(remarkName.trim());
            projectCommonRemarkMapper.insert(entity);
        }
    }

    private void ensureProjectCommonService(Long projectId, String serviceName,
                                            Integer workerType, BigDecimal unitPrice) {
        if (!StringUtils.hasText(serviceName)) {
            return;
        }
        long count = projectCommonServiceMapper.selectCount(
                new QueryWrapper<ProjectCommonServiceEntity>()
                        .eq("project_id", projectId)
                        .eq("service_name", serviceName.trim())
                        .eq("deleted", 0)
        );
        if (count == 0) {
            ProjectCommonServiceEntity entity = new ProjectCommonServiceEntity();
            entity.setProjectId(projectId);
            entity.setServiceName(serviceName.trim());
            entity.setWorkerType(workerType);
            entity.setUnitPrice(unitPrice == null ? BigDecimal.ZERO : unitPrice);
            projectCommonServiceMapper.insert(entity);
        }
    }

    private LedgerVO convertToVO(LedgerEntity entity) {
        LedgerVO vo = new LedgerVO();
        vo.setId(entity.getId());
        vo.setProjectId(entity.getProjectId());
        vo.setRecordDate(entity.getRecordDate());
        vo.setTotalAmount(entity.getTotalAmount());
        vo.setCreateTime(entity.getCreateTime());

        ProjectEntity project = projectMapper.selectById(entity.getProjectId());
        if (project != null) {
            vo.setProjectName(project.getProjectName());
        }

        List<LedgerItemEntity> itemEntities = ledgerItemMapper.selectByLedgerId(entity.getId());
        vo.setItems(itemEntities.stream().map(this::convertItemToVO).collect(Collectors.toList()));
        return vo;
    }

    private LedgerVO.LedgerItemVO convertItemToVO(LedgerItemEntity item) {
        LedgerVO.LedgerItemVO vo = new LedgerVO.LedgerItemVO();
        vo.setId(item.getId());
        vo.setLedgerId(item.getLedgerId());
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
        vo.setRemark(item.getRemark());
        vo.setSortOrder(item.getSortOrder());
        return vo;
    }
}
