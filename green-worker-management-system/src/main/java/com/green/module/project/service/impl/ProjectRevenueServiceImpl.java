package com.green.module.project.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.green.common.exception.BusinessException;
import com.green.common.result.ResultCodeEnum;
import com.green.module.project.dto.CreateRevenueRecordDTO;
import com.green.module.project.dto.UpdateRevenueRecordDTO;
import com.green.module.project.entity.CommonServiceNameEntity;
import com.green.module.project.entity.ProjectRevenueRecordEntity;
import com.green.module.project.entity.ProjectRevenueRecordItemEntity;
import com.green.module.project.mapper.CommonServiceNameMapper;
import com.green.module.project.mapper.ProjectRevenueRecordItemMapper;
import com.green.module.project.mapper.ProjectRevenueRecordMapper;
import com.green.module.project.service.ProjectRevenueService;
import com.green.module.project.vo.RevenueRecordVO;
import com.green.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 项目营业记录与常用服务名称服务实现
 */
@Service
@RequiredArgsConstructor
public class ProjectRevenueServiceImpl implements ProjectRevenueService {

    private final ProjectRevenueRecordMapper recordMapper;
    private final ProjectRevenueRecordItemMapper itemMapper;
    private final CommonServiceNameMapper commonServiceNameMapper;

    @Override
    public List<RevenueRecordVO> listByProject(Long projectId) {
        List<ProjectRevenueRecordEntity> records = recordMapper.selectList(
            new QueryWrapper<ProjectRevenueRecordEntity>()
                .eq("project_id", projectId)
                .eq("deleted", 0)
                .orderByDesc("record_date", "create_time")
        );
        return records.stream().map(this::convertToVO).collect(Collectors.toList());
    }

    @Override
    public RevenueRecordVO detail(Long recordId) {
        ProjectRevenueRecordEntity record = recordMapper.selectById(recordId);
        if (record == null || record.getDeleted() == 1) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "营业记录不存在");
        }
        return convertToVO(record);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createRecord(CreateRevenueRecordDTO dto) {
        BigDecimal totalAmount = BigDecimal.ZERO;
        List<ProjectRevenueRecordItemEntity> itemEntities = new ArrayList<>();

        for (CreateRevenueRecordDTO.RevenueItemDTO item : dto.getItems()) {
            BigDecimal qty = BigDecimal.valueOf(item.getQuantity());
            BigDecimal unitPrice = item.getUnitPrice();
            BigDecimal totalPrice = qty.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);

            ProjectRevenueRecordItemEntity entity = new ProjectRevenueRecordItemEntity();
            entity.setServiceName(item.getServiceName());
            entity.setWorkerType(item.getWorkerType());
            entity.setQuantity(item.getQuantity());
            entity.setUnitPrice(unitPrice);
            entity.setTotalPrice(totalPrice);
            entity.setRemark(item.getRemark());
            itemEntities.add(entity);

            totalAmount = totalAmount.add(totalPrice);
        }

        ProjectRevenueRecordEntity record = new ProjectRevenueRecordEntity();
        record.setProjectId(dto.getProjectId());
        record.setRecordDate(dto.getRecordDate());
        record.setTotalAmount(totalAmount);
        record.setRemark(dto.getRemark());
        recordMapper.insert(record);

        for (ProjectRevenueRecordItemEntity item : itemEntities) {
            item.setRecordId(record.getId());
            itemMapper.insert(item);
        }

        return record.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateRecord(Long recordId, UpdateRevenueRecordDTO dto) {
        ProjectRevenueRecordEntity record = recordMapper.selectById(recordId);
        if (record == null || record.getDeleted() == 1) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "营业记录不存在");
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<ProjectRevenueRecordItemEntity> itemEntities = new ArrayList<>();

        for (UpdateRevenueRecordDTO.RevenueItemDTO item : dto.getItems()) {
            BigDecimal qty = BigDecimal.valueOf(item.getQuantity());
            BigDecimal unitPrice = item.getUnitPrice();
            BigDecimal totalPrice = qty.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);

            ProjectRevenueRecordItemEntity entity = new ProjectRevenueRecordItemEntity();
            entity.setId(item.getId());
            entity.setRecordId(recordId);
            entity.setServiceName(item.getServiceName());
            entity.setWorkerType(item.getWorkerType());
            entity.setQuantity(item.getQuantity());
            entity.setUnitPrice(unitPrice);
            entity.setTotalPrice(totalPrice);
            entity.setRemark(item.getRemark());
            itemEntities.add(entity);

            totalAmount = totalAmount.add(totalPrice);
        }

        record.setRecordDate(dto.getRecordDate());
        record.setTotalAmount(totalAmount);
        record.setRemark(dto.getRemark());
        recordMapper.updateById(record);

        // 删除旧明细，重新插入
        itemMapper.delete(
            new QueryWrapper<ProjectRevenueRecordItemEntity>().eq("record_id", recordId)
        );
        for (ProjectRevenueRecordItemEntity item : itemEntities) {
            item.setRecordId(recordId);
            itemMapper.insert(item);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteRecord(Long recordId) {
        ProjectRevenueRecordEntity record = recordMapper.selectById(recordId);
        if (record == null || record.getDeleted() == 1) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "营业记录不存在");
        }
        recordMapper.deleteById(recordId);
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
    public Long createCommonServiceName(String serviceName) {
        if (serviceName == null || serviceName.trim().isEmpty()) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "服务名称不能为空");
        }
        CommonServiceNameEntity entity = new CommonServiceNameEntity();
        entity.setServiceName(serviceName.trim());
        entity.setIsSystem(0);
        commonServiceNameMapper.insert(entity);
        return entity.getId();
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

    private RevenueRecordVO convertToVO(ProjectRevenueRecordEntity record) {
        RevenueRecordVO vo = new RevenueRecordVO();
        vo.setId(record.getId());
        vo.setProjectId(record.getProjectId());
        vo.setRecordDate(record.getRecordDate());
        vo.setTotalAmount(record.getTotalAmount());
        vo.setRemark(record.getRemark());
        vo.setCreateTime(record.getCreateTime());

        List<ProjectRevenueRecordItemEntity> items = itemMapper.selectByRecordId(record.getId());
        vo.setItems(items.stream().map(this::convertItemToVO).collect(Collectors.toList()));
        return vo;
    }

    private RevenueRecordVO.RevenueRecordItemVO convertItemToVO(ProjectRevenueRecordItemEntity item) {
        RevenueRecordVO.RevenueRecordItemVO vo = new RevenueRecordVO.RevenueRecordItemVO();
        vo.setId(item.getId());
        vo.setServiceName(item.getServiceName());
        vo.setWorkerType(item.getWorkerType());
        vo.setWorkerTypeText(item.getWorkerType() != null && item.getWorkerType() == 2 ? "女工" : "男工");
        vo.setQuantity(item.getQuantity());
        vo.setUnitPrice(item.getUnitPrice());
        vo.setTotalPrice(item.getTotalPrice());
        vo.setRemark(item.getRemark());
        return vo;
    }
}
