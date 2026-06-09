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
}
