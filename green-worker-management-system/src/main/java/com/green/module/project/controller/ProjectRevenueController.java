package com.green.module.project.controller;

import com.green.common.result.ApiResult;
import com.green.module.project.dto.CreateRevenueRecordDTO;
import com.green.module.project.dto.UpdateRevenueRecordDTO;
import com.green.module.project.entity.CommonServiceNameEntity;
import com.green.module.project.entity.ProjectCommonServiceEntity;
import com.green.module.project.service.ProjectRevenueService;
import com.green.module.project.vo.RevenueRecordVO;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * 项目营业记录与常用服务名称控制器
 */
@RestController
@RequestMapping("/api/admin/projects")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ProjectRevenueController {

    private final ProjectRevenueService projectRevenueService;

    @GetMapping("/{projectId}/revenue-records")
    public ApiResult<List<RevenueRecordVO>> listRecords(@PathVariable Long projectId) {
        return ApiResult.success(projectRevenueService.listByProject(projectId));
    }

    @GetMapping("/revenue-records/{recordId}")
    public ApiResult<RevenueRecordVO> detailRecord(@PathVariable Long recordId) {
        return ApiResult.success(projectRevenueService.detail(recordId));
    }

    @PostMapping("/{projectId}/revenue-records")
    public ApiResult<Long> createRecord(
            @PathVariable Long projectId,
            @Valid @RequestBody CreateRevenueRecordDTO dto) {
        dto.setProjectId(projectId);
        return ApiResult.success(projectRevenueService.createRecord(dto));
    }

    @PutMapping("/revenue-records/{recordId}")
    public ApiResult<Void> updateRecord(
            @PathVariable Long recordId,
            @Valid @RequestBody UpdateRevenueRecordDTO dto) {
        projectRevenueService.updateRecord(recordId, dto);
        return ApiResult.success("修改成功");
    }

    @DeleteMapping("/revenue-records/{recordId}")
    public ApiResult<Void> deleteRecord(@PathVariable Long recordId) {
        projectRevenueService.deleteRecord(recordId);
        return ApiResult.success("删除成功");
    }

    @GetMapping("/{projectId}/revenue-records/export")
    public void exportRevenueRecords(
            @PathVariable Long projectId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "word") String format,
            HttpServletResponse response) throws IOException {
        projectRevenueService.exportRecords(projectId, startDate, endDate, format, response);
    }

    @GetMapping("/common-service-names")
    public ApiResult<List<CommonServiceNameEntity>> listCommonServiceNames() {
        return ApiResult.success(projectRevenueService.listCommonServiceNames());
    }

    @PostMapping("/common-service-names")
    public ApiResult<Long> createCommonServiceName(
            @RequestParam String serviceName,
            @RequestParam(required = false) BigDecimal basePrice) {
        return ApiResult.success(projectRevenueService.createCommonServiceName(serviceName, basePrice));
    }

    @PutMapping("/common-service-names/{id}")
    public ApiResult<Void> updateCommonServiceName(
            @PathVariable Long id,
            @RequestParam String serviceName,
            @RequestParam(required = false) BigDecimal basePrice) {
        projectRevenueService.updateCommonServiceName(id, serviceName, basePrice);
        return ApiResult.success("修改成功");
    }

    @DeleteMapping("/common-service-names/{id}")
    public ApiResult<Void> deleteCommonServiceName(@PathVariable Long id) {
        projectRevenueService.deleteCommonServiceName(id);
        return ApiResult.success("删除成功");
    }

    @GetMapping("/{projectId}/common-services")
    public ApiResult<List<ProjectCommonServiceEntity>> listProjectCommonServices(@PathVariable Long projectId) {
        return ApiResult.success(projectRevenueService.listProjectCommonServices(projectId));
    }

    @PostMapping("/{projectId}/common-services")
    public ApiResult<Long> createProjectCommonService(
            @PathVariable Long projectId,
            @RequestParam String serviceName,
            @RequestParam(required = false) Integer workerType,
            @RequestParam BigDecimal unitPrice) {
        return ApiResult.success(projectRevenueService.createProjectCommonService(projectId, serviceName, workerType, unitPrice));
    }

    @PutMapping("/common-services/{id}")
    public ApiResult<Void> updateProjectCommonService(
            @PathVariable Long id,
            @RequestParam String serviceName,
            @RequestParam(required = false) Integer workerType,
            @RequestParam BigDecimal unitPrice) {
        projectRevenueService.updateProjectCommonService(id, serviceName, workerType, unitPrice);
        return ApiResult.success("修改成功");
    }

    @DeleteMapping("/common-services/{id}")
    public ApiResult<Void> deleteProjectCommonService(@PathVariable Long id) {
        projectRevenueService.deleteProjectCommonService(id);
        return ApiResult.success("删除成功");
    }
}
