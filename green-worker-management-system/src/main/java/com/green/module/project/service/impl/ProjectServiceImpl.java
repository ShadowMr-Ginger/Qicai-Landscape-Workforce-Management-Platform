package com.green.module.project.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.green.common.exception.BusinessException;
import com.green.common.result.ResultCodeEnum;
import com.green.module.attendance.entity.DriverAttendanceRecordEntity;
import com.green.module.attendance.entity.WorkerAttendanceRecordEntity;
import com.green.module.attendance.mapper.DriverAttendanceRecordMapper;
import com.green.module.attendance.mapper.WorkerAttendanceRecordMapper;
import com.green.module.project.dto.CreateProjectDTO;
import com.green.module.project.dto.UpdateProjectDTO;
import com.green.module.project.entity.ProjectEntity;
import com.green.module.project.mapper.ProjectMapper;
import com.green.module.project.service.ProjectService;
import com.green.module.project.vo.ProjectCalendarDayVO;
import com.green.module.project.vo.ProjectCalendarSummaryVO;
import com.green.module.project.vo.ProjectVO;
import com.green.module.worker.entity.WorkerEntity;
import com.green.module.worker.mapper.WorkerMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 项目服务实现
 */
@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

    private final ProjectMapper projectMapper;
    private final WorkerAttendanceRecordMapper workerAttendanceRecordMapper;
    private final DriverAttendanceRecordMapper driverAttendanceRecordMapper;
    private final WorkerMapper workerMapper;

    @Override
    public IPage<ProjectVO> list(int pageNum, int pageSize, String keyword) {
        QueryWrapper<ProjectEntity> wrapper = new QueryWrapper<>();
        wrapper.orderByDesc("create_time");
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.like("project_name", keyword);
        }
        Page<ProjectEntity> page = new Page<>(pageNum, pageSize);
        IPage<ProjectEntity> entityPage = projectMapper.selectPage(page, wrapper);
        List<ProjectEntity> records = entityPage.getRecords();
        if (records.isEmpty()) {
            return entityPage.convert(this::convertToVO);
        }
        List<Long> projectIds = records.stream().map(ProjectEntity::getId).collect(Collectors.toList());
        Map<Long, BigDecimal> netProfitMap = calcNetProfitForProjects(projectIds);
        return entityPage.convert(entity -> {
            ProjectVO vo = convertToVO(entity);
            vo.setNetProfit(netProfitMap.getOrDefault(entity.getId(), BigDecimal.ZERO));
            return vo;
        });
    }

    @Override
    public ProjectVO detail(Long id) {
        ProjectEntity entity = projectMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "项目不存在");
        }
        ProjectVO vo = convertToVO(entity);
        Map<Long, BigDecimal> netProfitMap = calcNetProfitForProjects(Collections.singletonList(id));
        vo.setNetProfit(netProfitMap.getOrDefault(id, BigDecimal.ZERO));
        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long create(CreateProjectDTO dto) {
        ProjectEntity entity = new ProjectEntity();
        BeanUtils.copyProperties(dto, entity);
        entity.setStatus(1);
        entity.setIsSystem(0);
        entity.setIsClosed(0);
        entity.setTotalRevenue(BigDecimal.ZERO);
        entity.setProfit(BigDecimal.ZERO);
        projectMapper.insert(entity);
        return entity.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(Long id, UpdateProjectDTO dto) {
        ProjectEntity entity = projectMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "项目不存在");
        }
        if (entity.getIsSystem() != null && entity.getIsSystem() == 1) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "系统项目不可编辑");
        }
        BeanUtils.copyProperties(dto, entity);
        projectMapper.updateById(entity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        ProjectEntity entity = projectMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "项目不存在");
        }
        if (entity.getIsSystem() != null && entity.getIsSystem() == 1) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "系统项目不可删除");
        }

        Long defaultProjectId = getDefaultProjectId();
        if (defaultProjectId == null) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "默认项目不存在，无法删除");
        }

        // 将关联的工人考勤记录迁移到默认项目
        WorkerAttendanceRecordEntity updateRecord = new WorkerAttendanceRecordEntity();
        updateRecord.setProjectId(defaultProjectId);
        workerAttendanceRecordMapper.update(updateRecord,
            new QueryWrapper<WorkerAttendanceRecordEntity>().eq("project_id", id));

        projectMapper.deleteById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void closeProject(Long id) {
        ProjectEntity entity = projectMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "项目不存在");
        }
        if (entity.getIsSystem() != null && entity.getIsSystem() == 1) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "系统项目不可结项");
        }
        entity.setStatus(2);
        entity.setIsClosed(1);
        entity.setCloseTime(LocalDateTime.now());
        projectMapper.updateById(entity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void reopenProject(Long id) {
        ProjectEntity entity = projectMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "项目不存在");
        }
        entity.setStatus(1);
        entity.setIsClosed(0);
        entity.setCloseTime(null);
        projectMapper.updateById(entity);
    }

    @Override
    public List<ProjectVO> listAllActive() {
        QueryWrapper<ProjectEntity> wrapper = new QueryWrapper<>();
        wrapper.eq("status", 1).orderByDesc("create_time");
        return projectMapper.selectList(wrapper).stream()
            .map(this::convertToVO)
            .collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> getProjectCalendar(Long projectId, Integer year, Integer month) {
        ProjectEntity project = projectMapper.selectById(projectId);
        if (project == null) {
            throw new BusinessException(ResultCodeEnum.BAD_REQUEST, "项目不存在");
        }

        YearMonth ym = YearMonth.of(year, month);
        LocalDate startDate = ym.atDay(1);
        LocalDate endDate = ym.atEndOfMonth();

        // 查询该月该项目下的所有工人考勤记录
        List<WorkerAttendanceRecordEntity> records = workerAttendanceRecordMapper.selectList(
            new QueryWrapper<WorkerAttendanceRecordEntity>()
                .eq("project_id", projectId)
                .between("attendance_date", startDate, endDate)
        );

        // 获取工人信息
        Set<Long> workerIds = records.stream()
            .map(WorkerAttendanceRecordEntity::getWorkerId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());
        Map<Long, WorkerEntity> workerMap = workerIds.isEmpty() ? Collections.emptyMap() :
            workerMapper.selectList(new QueryWrapper<WorkerEntity>().in("id", workerIds))
                .stream().collect(Collectors.toMap(WorkerEntity::getId, w -> w));

        // 按日期分组统计
        Map<LocalDate, List<WorkerAttendanceRecordEntity>> recordsByDate = records.stream()
            .collect(Collectors.groupingBy(WorkerAttendanceRecordEntity::getAttendanceDate));

        List<ProjectCalendarDayVO> days = new ArrayList<>();
        ProjectCalendarSummaryVO summary = new ProjectCalendarSummaryVO();
        summary.setTotalRevenue(BigDecimal.ZERO);
        summary.setTotalProfit(BigDecimal.ZERO);
        summary.setTotalPayableWage(BigDecimal.ZERO);
        summary.setTotalNetProfit(BigDecimal.ZERO);

        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            ProjectCalendarDayVO day = new ProjectCalendarDayVO();
            day.setDate(current.toString());

            List<WorkerAttendanceRecordEntity> dayRecords = recordsByDate.getOrDefault(current, Collections.emptyList());
            if (!dayRecords.isEmpty()) {
                day.setStatus(1);
                int maleCount = 0;
                int femaleCount = 0;
                BigDecimal wageCost = BigDecimal.ZERO;

                for (WorkerAttendanceRecordEntity record : dayRecords) {
                    WorkerEntity worker = workerMap.get(record.getWorkerId());
                    if (worker != null && worker.getGender() != null) {
                        if (worker.getGender() == 1) {
                            maleCount++;
                        } else {
                            femaleCount++;
                        }
                    }
                    if (record.getTotalWage() != null) {
                        wageCost = wageCost.add(record.getTotalWage());
                    }
                }

                BigDecimal revenue = BigDecimal.ZERO;
                if (project.getMaleDailyRevenue() != null) {
                    revenue = revenue.add(project.getMaleDailyRevenue().multiply(BigDecimal.valueOf(maleCount)));
                }
                if (project.getFemaleDailyRevenue() != null) {
                    revenue = revenue.add(project.getFemaleDailyRevenue().multiply(BigDecimal.valueOf(femaleCount)));
                }

                BigDecimal profit = BigDecimal.ZERO;
                if (project.getGrossMargin() != null) {
                    profit = revenue.multiply(project.getGrossMargin());
                }

                BigDecimal netProfit = profit.subtract(wageCost);

                day.setMaleCount(maleCount);
                day.setFemaleCount(femaleCount);
                day.setRevenue(revenue);
                day.setProfit(profit);
                day.setPayableWage(wageCost);
                day.setNetProfit(netProfit);

                summary.setTotalRevenue(summary.getTotalRevenue().add(revenue));
                summary.setTotalProfit(summary.getTotalProfit().add(profit));
                summary.setTotalPayableWage(summary.getTotalPayableWage().add(wageCost));
                summary.setTotalNetProfit(summary.getTotalNetProfit().add(netProfit));
            } else {
                day.setStatus(0);
                day.setMaleCount(0);
                day.setFemaleCount(0);
                day.setRevenue(BigDecimal.ZERO);
                day.setProfit(BigDecimal.ZERO);
                day.setPayableWage(BigDecimal.ZERO);
                day.setNetProfit(BigDecimal.ZERO);
            }
            days.add(day);
            current = current.plusDays(1);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("days", days);
        result.put("summary", summary);
        return result;
    }

    @Override
    public Map<String, Object> getTodayStats() {
        LocalDate today = LocalDate.now();

        // 今日工人考勤记录
        List<WorkerAttendanceRecordEntity> workerRecords = workerAttendanceRecordMapper.selectList(
            new QueryWrapper<WorkerAttendanceRecordEntity>()
                .eq("attendance_date", today)
        );

        // 获取项目信息
        Set<Long> projectIds = workerRecords.stream()
            .map(WorkerAttendanceRecordEntity::getProjectId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());
        Map<Long, ProjectEntity> projectMap = projectIds.isEmpty() ? Collections.emptyMap() :
            projectMapper.selectList(new QueryWrapper<ProjectEntity>().in("id", projectIds))
                .stream().collect(Collectors.toMap(ProjectEntity::getId, p -> p));

        // 获取工人信息
        Set<Long> workerIds = workerRecords.stream()
            .map(WorkerAttendanceRecordEntity::getWorkerId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());
        Map<Long, WorkerEntity> workerMap = workerIds.isEmpty() ? Collections.emptyMap() :
            workerMapper.selectList(new QueryWrapper<WorkerEntity>().in("id", workerIds))
                .stream().collect(Collectors.toMap(WorkerEntity::getId, w -> w));

        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalProfit = BigDecimal.ZERO;
        BigDecimal totalWorkerWage = BigDecimal.ZERO;

        for (WorkerAttendanceRecordEntity record : workerRecords) {
            ProjectEntity project = projectMap.get(record.getProjectId());
            WorkerEntity worker = workerMap.get(record.getWorkerId());
            if (project == null || worker == null) {
                if (record.getTotalWage() != null) {
                    totalWorkerWage = totalWorkerWage.add(record.getTotalWage());
                }
                continue;
            }

            BigDecimal dailyRevenue = (worker.getGender() != null && worker.getGender() == 1)
                ? project.getMaleDailyRevenue() : project.getFemaleDailyRevenue();
            if (dailyRevenue == null) dailyRevenue = BigDecimal.ZERO;

            totalRevenue = totalRevenue.add(dailyRevenue);

            if (project.getGrossMargin() != null) {
                totalProfit = totalProfit.add(dailyRevenue.multiply(project.getGrossMargin()));
            }

            if (record.getTotalWage() != null) {
                totalWorkerWage = totalWorkerWage.add(record.getTotalWage());
            }
        }

        // 今日司机考勤记录
        List<DriverAttendanceRecordEntity> driverRecords = driverAttendanceRecordMapper.selectList(
            new QueryWrapper<DriverAttendanceRecordEntity>()
                .eq("attendance_date", today)
        );
        BigDecimal totalDriverWage = driverRecords.stream()
            .map(DriverAttendanceRecordEntity::getTotalWage)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPayableWage = totalWorkerWage.add(totalDriverWage);
        BigDecimal netProfit = totalProfit.subtract(totalPayableWage);

        Map<String, Object> result = new HashMap<>();
        result.put("todayRevenue", totalRevenue);
        result.put("todayPayableWage", totalPayableWage);
        result.put("todayNetProfit", netProfit);
        result.put("todayProfit", totalProfit);
        result.put("todayWorkerWage", totalWorkerWage);
        result.put("todayDriverWage", totalDriverWage);
        result.put("workerCount", workerRecords.size());
        result.put("driverCount", driverRecords.size());
        return result;
    }

    private Map<Long, BigDecimal> calcNetProfitForProjects(List<Long> projectIds) {
        if (projectIds == null || projectIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<WorkerAttendanceRecordEntity> records = workerAttendanceRecordMapper.selectList(
            new QueryWrapper<WorkerAttendanceRecordEntity>()
                .in("project_id", projectIds)
        );
        Set<Long> workerIds = records.stream()
            .map(WorkerAttendanceRecordEntity::getWorkerId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());
        Map<Long, WorkerEntity> workerMap = workerIds.isEmpty() ? Collections.emptyMap() :
            workerMapper.selectList(new QueryWrapper<WorkerEntity>().in("id", workerIds))
                .stream().collect(Collectors.toMap(WorkerEntity::getId, w -> w));
        Map<Long, ProjectEntity> projectMap = projectMapper.selectList(
            new QueryWrapper<ProjectEntity>().in("id", projectIds)
        ).stream().collect(Collectors.toMap(ProjectEntity::getId, p -> p));
        Map<Long, List<WorkerAttendanceRecordEntity>> recordsByProject = records.stream()
            .collect(Collectors.groupingBy(WorkerAttendanceRecordEntity::getProjectId));
        Map<Long, BigDecimal> result = new HashMap<>();
        for (Long pid : projectIds) {
            List<WorkerAttendanceRecordEntity> projRecords = recordsByProject.getOrDefault(pid, Collections.emptyList());
            ProjectEntity project = projectMap.get(pid);
            if (project == null) {
                result.put(pid, BigDecimal.ZERO);
                continue;
            }
            int maleCount = 0;
            int femaleCount = 0;
            BigDecimal totalWage = BigDecimal.ZERO;
            for (WorkerAttendanceRecordEntity record : projRecords) {
                WorkerEntity worker = workerMap.get(record.getWorkerId());
                if (worker != null && worker.getGender() != null) {
                    if (worker.getGender() == 1) maleCount++;
                    else femaleCount++;
                }
                if (record.getTotalWage() != null) {
                    totalWage = totalWage.add(record.getTotalWage());
                }
            }
            BigDecimal revenue = BigDecimal.ZERO;
            if (project.getMaleDailyRevenue() != null) {
                revenue = revenue.add(project.getMaleDailyRevenue().multiply(BigDecimal.valueOf(maleCount)));
            }
            if (project.getFemaleDailyRevenue() != null) {
                revenue = revenue.add(project.getFemaleDailyRevenue().multiply(BigDecimal.valueOf(femaleCount)));
            }
            BigDecimal profit = BigDecimal.ZERO;
            if (project.getGrossMargin() != null) {
                profit = revenue.multiply(project.getGrossMargin());
            }
            result.put(pid, profit.subtract(totalWage));
        }
        return result;
    }

    private Long getDefaultProjectId() {
        QueryWrapper<ProjectEntity> wrapper = new QueryWrapper<>();
        wrapper.eq("is_system", 1).last("LIMIT 1");
        ProjectEntity defaultProject = projectMapper.selectOne(wrapper);
        return defaultProject != null ? defaultProject.getId() : null;
    }

    private ProjectVO convertToVO(ProjectEntity entity) {
        ProjectVO vo = new ProjectVO();
        BeanUtils.copyProperties(entity, vo);
        if (entity.getStatus() != null) {
            vo.setStatusText(entity.getStatus() == 1 ? "进行中" : "已结项");
        }
        if (entity.getIsSystem() != null) {
            vo.setIsSystemText(entity.getIsSystem() == 1 ? "是" : "否");
        }
        if (entity.getIsClosed() != null) {
            vo.setIsClosedText(entity.getIsClosed() == 1 ? "是" : "否");
        }
        return vo;
    }
}
