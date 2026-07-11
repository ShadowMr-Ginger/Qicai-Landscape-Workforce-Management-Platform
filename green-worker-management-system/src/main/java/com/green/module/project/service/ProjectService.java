package com.green.module.project.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.green.module.project.dto.CreateProjectDTO;
import com.green.module.project.dto.UpdateProjectDTO;
import com.green.module.project.vo.ProjectVO;

import java.util.List;
import java.util.Map;

/**
 * 项目服务接口
 */
public interface ProjectService {

    IPage<ProjectVO> list(int pageNum, int pageSize, String keyword);

    ProjectVO detail(Long id);

    Long create(CreateProjectDTO dto);

    void update(Long id, UpdateProjectDTO dto);

    void delete(Long id);

    void closeProject(Long id);

    void reopenProject(Long id);

    List<ProjectVO> listAllActive();

    Map<String, Object> getProjectCalendar(Long projectId, Integer year, Integer month);

    Map<String, Object> getTodayStats();

    /**
     * 获取财务概览：今日/本月/本年营业、待付工资、净利润及月度趋势
     */
    Map<String, Object> getFinancialOverview();

    /**
     * 获取指定年月的每日财务明细（营业额、工人工资、司机工资、净利润）
     */
    Map<String, Object> getFinancialOverviewDaily(Integer year, Integer month);

    /**
     * 获取项目详情页统计：总工数、今日工数、待发工资累计
     */
    Map<String, Object> getProjectDetailStats(Long projectId);
}
