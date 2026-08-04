package com.green.module.expense.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.green.common.exception.BusinessException;
import com.green.common.result.ResultCodeEnum;
import com.green.module.expense.dto.ExpenseItemDTO;
import com.green.module.expense.entity.ExpenseItemCommonRemarkEntity;
import com.green.module.expense.entity.ExpenseItemCommonSubjectEntity;
import com.green.module.expense.entity.ExpenseItemEntity;
import com.green.module.expense.entity.ExpenseRecordEntity;
import com.green.module.expense.mapper.ExpenseItemCommonRemarkMapper;
import com.green.module.expense.mapper.ExpenseItemCommonSubjectMapper;
import com.green.module.expense.mapper.ExpenseItemMapper;
import com.green.module.expense.mapper.ExpenseRecordMapper;
import com.green.module.expense.service.ExpenseItemService;
import com.green.module.expense.vo.ExpenseItemVO;
import com.green.module.project.entity.ProjectEntity;
import com.green.module.project.mapper.ProjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 开支项目服务实现
 */
@Service
@RequiredArgsConstructor
public class ExpenseItemServiceImpl implements ExpenseItemService {

    private final ExpenseItemMapper expenseItemMapper;
    private final ExpenseItemCommonSubjectMapper commonSubjectMapper;
    private final ExpenseItemCommonRemarkMapper commonRemarkMapper;
    private final ExpenseRecordMapper expenseRecordMapper;
    private final ProjectMapper projectMapper;

    @Override
    public Page<ExpenseItemVO> pageList(String keyword, Integer pageNum, Integer pageSize) {
        Page<ExpenseItemEntity> page = new Page<>(pageNum == null ? 1 : pageNum,
                pageSize == null ? 50 : pageSize);
        QueryWrapper<ExpenseItemEntity> wrapper = new QueryWrapper<ExpenseItemEntity>()
                .orderByDesc("create_time");
        if (StringUtils.hasText(keyword)) {
            wrapper.like("item_name", keyword.trim());
        }
        Page<ExpenseItemEntity> entityPage = expenseItemMapper.selectPage(page, wrapper);

        List<Long> projectIds = entityPage.getRecords().stream()
                .map(ExpenseItemEntity::getProjectId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, String> projectNameMap = projectIds.isEmpty() ? Collections.emptyMap() :
                projectMapper.selectList(
                        new QueryWrapper<ProjectEntity>().in("id", projectIds)
                ).stream().collect(Collectors.toMap(ProjectEntity::getId, ProjectEntity::getProjectName));

        List<ExpenseItemVO> records = entityPage.getRecords().stream()
                .map(e -> {
                    ExpenseItemVO vo = new ExpenseItemVO();
                    BeanUtils.copyProperties(e, vo);
                    vo.setProjectName(projectNameMap.getOrDefault(e.getProjectId(), ""));
                    return vo;
                }).collect(Collectors.toList());

        Page<ExpenseItemVO> result = new Page<>(entityPage.getCurrent(), entityPage.getSize(), entityPage.getTotal());
        result.setRecords(records);
        return result;
    }

    @Override
    public List<ExpenseItemVO> listAll() {
        List<ExpenseItemEntity> entities = expenseItemMapper.selectList(
                new QueryWrapper<ExpenseItemEntity>().orderByDesc("create_time")
        );
        List<Long> projectIds = entities.stream()
                .map(ExpenseItemEntity::getProjectId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, String> projectNameMap = projectIds.isEmpty() ? Collections.emptyMap() :
                projectMapper.selectList(
                        new QueryWrapper<ProjectEntity>().in("id", projectIds)
                ).stream().collect(Collectors.toMap(ProjectEntity::getId, ProjectEntity::getProjectName));

        return entities.stream().map(e -> {
            ExpenseItemVO vo = new ExpenseItemVO();
            BeanUtils.copyProperties(e, vo);
            vo.setProjectName(projectNameMap.getOrDefault(e.getProjectId(), ""));
            return vo;
        }).collect(Collectors.toList());
    }

    @Override
    public ExpenseItemVO detail(Long id) {
        ExpenseItemEntity entity = expenseItemMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "开支项目不存在");
        }
        ExpenseItemVO vo = convertToVO(entity);
        vo.setCommonSubjects(listCommonSubjectVOs(id));
        vo.setCommonRemarks(listCommonRemarkVOs(id));
        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long create(ExpenseItemDTO dto) {
        validateProject(dto.getProjectId());
        ExpenseItemEntity entity = new ExpenseItemEntity();
        entity.setProjectId(dto.getProjectId());
        entity.setItemName(dto.getItemName().trim());
        entity.setDescription(dto.getDescription());
        entity.setTotalExpense(BigDecimal.ZERO);
        expenseItemMapper.insert(entity);
        return entity.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(Long id, ExpenseItemDTO dto) {
        ExpenseItemEntity entity = expenseItemMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "开支项目不存在");
        }
        validateProject(dto.getProjectId());
        entity.setProjectId(dto.getProjectId());
        entity.setItemName(dto.getItemName().trim());
        entity.setDescription(dto.getDescription());
        expenseItemMapper.updateById(entity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        ExpenseItemEntity entity = expenseItemMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "开支项目不存在");
        }
        long count = expenseRecordMapper.selectCount(
                new QueryWrapper<ExpenseRecordEntity>().eq("expense_item_id", id)
        );
        if (count > 0) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "该开支项目下存在开销记录，无法删除");
        }
        expenseItemMapper.deleteById(id);
        commonSubjectMapper.delete(
                new QueryWrapper<ExpenseItemCommonSubjectEntity>().eq("expense_item_id", id)
        );
        commonRemarkMapper.delete(
                new QueryWrapper<ExpenseItemCommonRemarkEntity>().eq("expense_item_id", id)
        );
    }

    @Override
    public List<ExpenseItemVO.CommonSubjectVO> listCommonSubjects(Long expenseItemId) {
        return listCommonSubjectVOs(expenseItemId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createCommonSubject(Long expenseItemId, ExpenseItemDTO.CommonSubjectDTO dto) {
        ExpenseItemEntity item = expenseItemMapper.selectById(expenseItemId);
        if (item == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "开支项目不存在");
        }
        ExpenseItemCommonSubjectEntity entity = new ExpenseItemCommonSubjectEntity();
        entity.setExpenseItemId(expenseItemId);
        entity.setSubjectName(dto.getSubjectName().trim());
        commonSubjectMapper.insert(entity);
        return entity.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateCommonSubject(Long id, ExpenseItemDTO.CommonSubjectDTO dto) {
        ExpenseItemCommonSubjectEntity entity = commonSubjectMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "常用主体不存在");
        }
        entity.setSubjectName(dto.getSubjectName().trim());
        commonSubjectMapper.updateById(entity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteCommonSubject(Long id) {
        commonSubjectMapper.deleteById(id);
    }

    @Override
    public List<ExpenseItemVO.CommonRemarkVO> listCommonRemarks(Long expenseItemId) {
        return listCommonRemarkVOs(expenseItemId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createCommonRemark(Long expenseItemId, ExpenseItemDTO.CommonRemarkDTO dto) {
        ExpenseItemEntity item = expenseItemMapper.selectById(expenseItemId);
        if (item == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "开支项目不存在");
        }
        ExpenseItemCommonRemarkEntity entity = new ExpenseItemCommonRemarkEntity();
        entity.setExpenseItemId(expenseItemId);
        entity.setRemarkName(dto.getRemarkName().trim());
        commonRemarkMapper.insert(entity);
        return entity.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateCommonRemark(Long id, ExpenseItemDTO.CommonRemarkDTO dto) {
        ExpenseItemCommonRemarkEntity entity = commonRemarkMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "常用备注不存在");
        }
        entity.setRemarkName(dto.getRemarkName().trim());
        commonRemarkMapper.updateById(entity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteCommonRemark(Long id) {
        commonRemarkMapper.deleteById(id);
    }

    private ExpenseItemVO convertToVO(ExpenseItemEntity entity) {
        ExpenseItemVO vo = new ExpenseItemVO();
        BeanUtils.copyProperties(entity, vo);
        if (entity.getProjectId() != null) {
            ProjectEntity project = projectMapper.selectById(entity.getProjectId());
            vo.setProjectName(project != null ? project.getProjectName() : "");
        }
        return vo;
    }

    private List<ExpenseItemVO.CommonSubjectVO> listCommonSubjectVOs(Long expenseItemId) {
        List<ExpenseItemCommonSubjectEntity> entities = commonSubjectMapper.selectList(
                new QueryWrapper<ExpenseItemCommonSubjectEntity>()
                        .eq("expense_item_id", expenseItemId)
                        .orderByAsc("create_time")
        );
        return entities.stream().map(e -> {
            ExpenseItemVO.CommonSubjectVO vo = new ExpenseItemVO.CommonSubjectVO();
            BeanUtils.copyProperties(e, vo);
            return vo;
        }).collect(Collectors.toList());
    }

    private List<ExpenseItemVO.CommonRemarkVO> listCommonRemarkVOs(Long expenseItemId) {
        List<ExpenseItemCommonRemarkEntity> entities = commonRemarkMapper.selectList(
                new QueryWrapper<ExpenseItemCommonRemarkEntity>()
                        .eq("expense_item_id", expenseItemId)
                        .orderByAsc("create_time")
        );
        return entities.stream().map(e -> {
            ExpenseItemVO.CommonRemarkVO vo = new ExpenseItemVO.CommonRemarkVO();
            BeanUtils.copyProperties(e, vo);
            return vo;
        }).collect(Collectors.toList());
    }

    private void validateProject(Long projectId) {
        ProjectEntity project = projectMapper.selectById(projectId);
        if (project == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "关联项目不存在");
        }
    }
}
