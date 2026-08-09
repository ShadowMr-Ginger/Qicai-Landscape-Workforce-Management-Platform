package com.green.module.expense.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.green.common.exception.BusinessException;
import com.green.common.result.ResultCodeEnum;
import com.green.module.expense.dto.ExpenseRecordDTO;
import com.green.module.expense.entity.ExpenseItemCommonRemarkEntity;
import com.green.module.expense.entity.ExpenseItemCommonSubjectEntity;
import com.green.module.expense.entity.ExpenseItemEntity;
import com.green.module.expense.entity.ExpenseRecordEntity;
import com.green.module.expense.entity.ExpenseRecordItemEntity;
import com.green.module.expense.mapper.ExpenseItemCommonRemarkMapper;
import com.green.module.expense.mapper.ExpenseItemCommonSubjectMapper;
import com.green.module.expense.mapper.ExpenseItemMapper;
import com.green.module.expense.mapper.ExpenseRecordItemMapper;
import com.green.module.expense.mapper.ExpenseRecordMapper;
import com.green.module.expense.service.ExpenseRecordService;
import com.green.module.expense.vo.ExpenseRecordVO;
import com.green.module.project.entity.ProjectEntity;
import com.green.module.project.mapper.ProjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 开销记录服务实现
 */
@Service
@RequiredArgsConstructor
public class ExpenseRecordServiceImpl implements ExpenseRecordService {

    private final ExpenseRecordMapper expenseRecordMapper;
    private final ExpenseRecordItemMapper expenseRecordItemMapper;
    private final ExpenseItemMapper expenseItemMapper;
    private final ExpenseItemCommonSubjectMapper commonSubjectMapper;
    private final ExpenseItemCommonRemarkMapper commonRemarkMapper;
    private final ProjectMapper projectMapper;

    @Override
    public Page<ExpenseRecordVO> pageList(Long projectId, Long expenseItemId,
                                        LocalDate startDate, LocalDate endDate,
                                        Integer pageNum, Integer pageSize) {
        Page<ExpenseRecordEntity> page = new Page<>(pageNum == null ? 1 : pageNum,
                pageSize == null ? 50 : pageSize);
        QueryWrapper<ExpenseRecordEntity> wrapper = new QueryWrapper<ExpenseRecordEntity>()
                .orderByDesc("record_date", "create_time");
        if (projectId != null) {
            wrapper.eq("project_id", projectId);
        }
        if (expenseItemId != null) {
            wrapper.eq("expense_item_id", expenseItemId);
        }
        if (startDate != null) {
            wrapper.ge("record_date", startDate);
        }
        if (endDate != null) {
            wrapper.le("record_date", endDate);
        }
        Page<ExpenseRecordEntity> entityPage = expenseRecordMapper.selectPage(page, wrapper);

        List<Long> projectIds = entityPage.getRecords().stream()
                .map(ExpenseRecordEntity::getProjectId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        List<Long> expenseItemIds = entityPage.getRecords().stream()
                .map(ExpenseRecordEntity::getExpenseItemId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, String> projectNameMap = projectIds.isEmpty() ? Collections.emptyMap() :
                projectMapper.selectList(
                        new QueryWrapper<ProjectEntity>().in("id", projectIds)
                ).stream().collect(Collectors.toMap(ProjectEntity::getId, ProjectEntity::getProjectName));

        Map<Long, String> itemNameMap = expenseItemIds.isEmpty() ? Collections.emptyMap() :
                expenseItemMapper.selectList(
                        new QueryWrapper<ExpenseItemEntity>().in("id", expenseItemIds)
                ).stream().collect(Collectors.toMap(ExpenseItemEntity::getId, ExpenseItemEntity::getItemName));

        List<ExpenseRecordVO> records = entityPage.getRecords().stream()
                .map(e -> {
                    ExpenseRecordVO vo = convertToVO(e, projectNameMap, itemNameMap);
                    List<ExpenseRecordItemEntity> items = expenseRecordItemMapper.selectList(
                            new QueryWrapper<ExpenseRecordItemEntity>()
                                    .eq("expense_record_id", e.getId())
                                    .orderByAsc("sort_order", "create_time")
                    );
                    vo.setItems(items.stream().map(this::convertItemToVO).collect(Collectors.toList()));
                    vo.setItemCount(items.size());
                    return vo;
                })
                .collect(Collectors.toList());

        Page<ExpenseRecordVO> result = new Page<>(entityPage.getCurrent(), entityPage.getSize(), entityPage.getTotal());
        result.setRecords(records);
        return result;
    }

    @Override
    public ExpenseRecordVO detail(Long id) {
        ExpenseRecordEntity entity = expenseRecordMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "开销记录不存在");
        }
        return loadDetail(entity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long create(ExpenseRecordDTO dto) {
        validateProjectAndExpenseItem(dto.getProjectId(), dto.getExpenseItemId());

        ExpenseRecordEntity record = new ExpenseRecordEntity();
        record.setProjectId(dto.getProjectId());
        record.setExpenseItemId(dto.getExpenseItemId());
        record.setRecordDate(dto.getRecordDate());

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<ExpenseRecordItemEntity> itemEntities = new ArrayList<>();
        int sortOrder = 0;
        for (ExpenseRecordDTO.ExpenseRecordItemDTO item : dto.getItems()) {
            BigDecimal totalPrice = BigDecimal.valueOf(item.getQuantity())
                    .multiply(item.getUnitPrice())
                    .setScale(2, RoundingMode.HALF_UP);
            ExpenseRecordItemEntity entity = new ExpenseRecordItemEntity();
            entity.setSubjectName(item.getSubjectName().trim());
            entity.setQuantity(item.getQuantity());
            entity.setUnitPrice(item.getUnitPrice());
            entity.setTotalPrice(totalPrice);
            entity.setRemark(item.getRemark());
            entity.setSortOrder(sortOrder++);
            itemEntities.add(entity);
            totalAmount = totalAmount.add(totalPrice);
        }

        record.setTotalAmount(totalAmount);
        expenseRecordMapper.insert(record);

        for (ExpenseRecordItemEntity item : itemEntities) {
            item.setExpenseRecordId(record.getId());
            expenseRecordItemMapper.insert(item);
            ensureCommonSubject(record.getExpenseItemId(), item.getSubjectName());
            ensureCommonRemark(record.getExpenseItemId(), item.getRemark());
        }

        refreshExpenseItemTotal(record.getExpenseItemId());
        return record.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(Long id, ExpenseRecordDTO dto) {
        ExpenseRecordEntity record = expenseRecordMapper.selectById(id);
        if (record == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "开销记录不存在");
        }
        validateProjectAndExpenseItem(dto.getProjectId(), dto.getExpenseItemId());

        Long oldExpenseItemId = record.getExpenseItemId();

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<ExpenseRecordItemEntity> itemEntities = new ArrayList<>();
        int sortOrder = 0;
        for (ExpenseRecordDTO.ExpenseRecordItemDTO item : dto.getItems()) {
            BigDecimal totalPrice = BigDecimal.valueOf(item.getQuantity())
                    .multiply(item.getUnitPrice())
                    .setScale(2, RoundingMode.HALF_UP);
            ExpenseRecordItemEntity entity = new ExpenseRecordItemEntity();
            entity.setSubjectName(item.getSubjectName().trim());
            entity.setQuantity(item.getQuantity());
            entity.setUnitPrice(item.getUnitPrice());
            entity.setTotalPrice(totalPrice);
            entity.setRemark(item.getRemark());
            entity.setSortOrder(sortOrder++);
            itemEntities.add(entity);
            totalAmount = totalAmount.add(totalPrice);
        }

        record.setProjectId(dto.getProjectId());
        record.setExpenseItemId(dto.getExpenseItemId());
        record.setRecordDate(dto.getRecordDate());
        record.setTotalAmount(totalAmount);
        expenseRecordMapper.updateById(record);

        expenseRecordItemMapper.delete(
                new QueryWrapper<ExpenseRecordItemEntity>().eq("expense_record_id", id)
        );

        for (ExpenseRecordItemEntity item : itemEntities) {
            item.setExpenseRecordId(id);
            expenseRecordItemMapper.insert(item);
            ensureCommonSubject(record.getExpenseItemId(), item.getSubjectName());
            ensureCommonRemark(record.getExpenseItemId(), item.getRemark());
        }

        refreshExpenseItemTotal(record.getExpenseItemId());
        if (!record.getExpenseItemId().equals(oldExpenseItemId)) {
            refreshExpenseItemTotal(oldExpenseItemId);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        ExpenseRecordEntity record = expenseRecordMapper.selectById(id);
        if (record == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "开销记录不存在");
        }
        Long expenseItemId = record.getExpenseItemId();
        expenseRecordMapper.deleteById(id);
        expenseRecordItemMapper.delete(
                new QueryWrapper<ExpenseRecordItemEntity>().eq("expense_record_id", id)
        );
        refreshExpenseItemTotal(expenseItemId);
    }

    @Override
    public Map<LocalDate, BigDecimal> sumAmountByProjectAndDateRange(Long projectId, LocalDate startDate, LocalDate endDate) {
        if (projectId == null || startDate == null || endDate == null) {
            return Collections.emptyMap();
        }
        return expenseRecordMapper.sumAmountByProjectAndDateRange(projectId, startDate, endDate).stream()
                .collect(Collectors.toMap(
                        m -> LocalDate.parse(String.valueOf(m.get("recordDate"))),
                        m -> new BigDecimal(String.valueOf(m.get("totalAmount"))),
                        (a, b) -> a
                ));
    }

    @Override
    public Map<LocalDate, BigDecimal> sumAmountByDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            return Collections.emptyMap();
        }
        return expenseRecordMapper.sumAmountByDateRange(startDate, endDate).stream()
                .collect(Collectors.toMap(
                        m -> LocalDate.parse(String.valueOf(m.get("recordDate"))),
                        m -> new BigDecimal(String.valueOf(m.get("totalAmount"))),
                        (a, b) -> a
                ));
    }

    @Override
    public BigDecimal sumAmountByProjectAndDate(Long projectId, LocalDate recordDate) {
        if (projectId == null || recordDate == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal amount = expenseRecordMapper.sumAmountByProjectAndDate(projectId, recordDate);
        return amount == null ? BigDecimal.ZERO : amount;
    }

    @Override
    public BigDecimal sumAmountByDate(LocalDate recordDate) {
        if (recordDate == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal amount = expenseRecordMapper.sumAmountByDate(recordDate);
        return amount == null ? BigDecimal.ZERO : amount;
    }

    private ExpenseRecordVO loadDetail(ExpenseRecordEntity entity) {
        Map<Long, String> projectNameMap = Collections.emptyMap();
        Map<Long, String> itemNameMap = Collections.emptyMap();
        if (entity.getProjectId() != null) {
            ProjectEntity project = projectMapper.selectById(entity.getProjectId());
            projectNameMap = project == null ? Collections.emptyMap() :
                    Collections.singletonMap(entity.getProjectId(), project.getProjectName());
        }
        if (entity.getExpenseItemId() != null) {
            ExpenseItemEntity item = expenseItemMapper.selectById(entity.getExpenseItemId());
            itemNameMap = item == null ? Collections.emptyMap() :
                    Collections.singletonMap(entity.getExpenseItemId(), item.getItemName());
        }
        ExpenseRecordVO vo = convertToVO(entity, projectNameMap, itemNameMap);

        List<ExpenseRecordItemEntity> items = expenseRecordItemMapper.selectList(
                new QueryWrapper<ExpenseRecordItemEntity>()
                        .eq("expense_record_id", entity.getId())
                        .orderByAsc("sort_order", "create_time")
        );
        vo.setItems(items.stream().map(this::convertItemToVO).collect(Collectors.toList()));
        return vo;
    }

    private ExpenseRecordVO convertToVO(ExpenseRecordEntity entity,
                                         Map<Long, String> projectNameMap,
                                         Map<Long, String> itemNameMap) {
        ExpenseRecordVO vo = new ExpenseRecordVO();
        BeanUtils.copyProperties(entity, vo);
        vo.setProjectName(projectNameMap.getOrDefault(entity.getProjectId(), ""));
        vo.setExpenseItemName(itemNameMap.getOrDefault(entity.getExpenseItemId(), ""));
        vo.setItemCount(0);
        return vo;
    }

    private ExpenseRecordVO.ExpenseRecordItemVO convertItemToVO(ExpenseRecordItemEntity entity) {
        ExpenseRecordVO.ExpenseRecordItemVO vo = new ExpenseRecordVO.ExpenseRecordItemVO();
        BeanUtils.copyProperties(entity, vo);
        return vo;
    }

    private void validateProjectAndExpenseItem(Long projectId, Long expenseItemId) {
        if (projectId != null) {
            ProjectEntity project = projectMapper.selectById(projectId);
            if (project == null) {
                throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "关联项目不存在");
            }
        }
        ExpenseItemEntity item = expenseItemMapper.selectById(expenseItemId);
        if (item == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "开支项目不存在");
        }
    }

    private void ensureCommonSubject(Long expenseItemId, String subjectName) {
        if (!StringUtils.hasText(subjectName)) {
            return;
        }
        String trimmed = subjectName.trim();
        long count = commonSubjectMapper.selectCount(
                new QueryWrapper<ExpenseItemCommonSubjectEntity>()
                        .eq("expense_item_id", expenseItemId)
                        .eq("subject_name", trimmed)
        );
        if (count == 0) {
            ExpenseItemCommonSubjectEntity entity = new ExpenseItemCommonSubjectEntity();
            entity.setExpenseItemId(expenseItemId);
            entity.setSubjectName(trimmed);
            commonSubjectMapper.insert(entity);
        }
    }

    private void ensureCommonRemark(Long expenseItemId, String remark) {
        if (!StringUtils.hasText(remark)) {
            return;
        }
        String trimmed = remark.trim();
        long count = commonRemarkMapper.selectCount(
                new QueryWrapper<ExpenseItemCommonRemarkEntity>()
                        .eq("expense_item_id", expenseItemId)
                        .eq("remark_name", trimmed)
        );
        if (count == 0) {
            ExpenseItemCommonRemarkEntity entity = new ExpenseItemCommonRemarkEntity();
            entity.setExpenseItemId(expenseItemId);
            entity.setRemarkName(trimmed);
            commonRemarkMapper.insert(entity);
        }
    }

    private void refreshExpenseItemTotal(Long expenseItemId) {
        if (expenseItemId == null) {
            return;
        }
        BigDecimal total = expenseRecordMapper.sumAmountByExpenseItem(expenseItemId);
        ExpenseItemEntity item = new ExpenseItemEntity();
        item.setId(expenseItemId);
        item.setTotalExpense(total == null ? BigDecimal.ZERO : total);
        expenseItemMapper.updateById(item);
    }
}
