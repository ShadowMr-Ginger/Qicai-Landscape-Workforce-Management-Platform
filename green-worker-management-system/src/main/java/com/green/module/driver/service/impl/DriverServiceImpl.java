package com.green.module.driver.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.green.common.constants.SystemConstants;
import com.green.common.exception.BusinessException;
import com.green.common.result.ResultCodeEnum;
import com.green.module.attendance.mapper.DriverAttendanceRecordMapper;
import com.green.module.auth.dto.AdminResetDriverPasswordDTO;
import com.green.module.auth.dto.DriverChangePasswordDTO;
import com.green.module.driver.dto.CreateDriverDTO;
import com.green.module.driver.dto.DriverQuery;
import com.green.module.driver.dto.UpdateDriverDTO;
import com.green.module.driver.entity.DriverEntity;
import com.green.module.driver.mapper.DriverMapper;
import com.green.module.driver.service.DriverService;
import com.green.module.anomaly.service.AnomalyRecordService;
import com.green.module.driver.vo.DriverDetailVO;
import com.green.module.driver.vo.DriverListVO;
import com.green.security.JwtTokenProvider;
import com.green.security.LoginUser;
import com.green.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 司机服务实现
 *
 * @author Green Team
 * @version 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DriverServiceImpl implements DriverService {

    private final DriverMapper driverMapper;
    private final DriverAttendanceRecordMapper driverAttendanceRecordMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AnomalyRecordService anomalyRecordService;

    // ==================== 认证相关 ====================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public String changePassword(DriverChangePasswordDTO dto) {
        Long driverId = SecurityUtils.getCurrentUserId();
        if (driverId == null) {
            throw new BusinessException(ResultCodeEnum.UNAUTHORIZED);
        }
        DriverEntity driver = driverMapper.selectById(driverId);
        if (driver == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "司机不存在");
        }
        if (!passwordEncoder.matches(dto.getOldPassword(), driver.getPassword())) {
            throw new BusinessException(ResultCodeEnum.OLD_PASSWORD_ERROR);
        }
        if (passwordEncoder.matches(dto.getNewPassword(), driver.getPassword())) {
            throw new BusinessException(ResultCodeEnum.BUSINESS_ERROR, "新密码不能与旧密码相同");
        }
        driver.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        driver.setPasswordChanged(1);
        driverMapper.updateById(driver);
        log.info("司机修改密码成功: driverId={}", driverId);

        // 重新生成 Token，更新 passwordChanged 标记
        LoginUser loginUser = LoginUser.builder()
                .userId(driver.getId())
                .username(driver.getRealName())
                .realName(driver.getRealName())
                .password(driver.getPassword())
                .role(com.green.common.enums.RoleEnum.DRIVER)
                .passwordChanged(true)
                .enabled(true)
                .build();
        return jwtTokenProvider.generateToken(loginUser);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void resetPassword(AdminResetDriverPasswordDTO dto) {
        DriverEntity driver = driverMapper.selectById(dto.getDriverId());
        if (driver == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "司机不存在");
        }
        driver.setPassword(passwordEncoder.encode(SystemConstants.DRIVER_DEFAULT_PASSWORD));
        driver.setPasswordChanged(0);
        driverMapper.updateById(driver);
        log.info("管理员重置司机密码成功: driverId={}", dto.getDriverId());
    }

    // ==================== 管理相关 ====================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long create(CreateDriverDTO dto) {
        DriverEntity entity = new DriverEntity();
        entity.setRealName(dto.getRealName());
        entity.setGender(dto.getGender());
        // 空字符串转 null，避免唯一索引 uk_phone 在多个空手机号时冲突
        entity.setPhone(blankToNull(dto.getPhone()));
        entity.setIdCard(blankToNull(dto.getIdCard()));
        entity.setEmergencyContactPhone(blankToNull(dto.getEmergencyContactPhone()));
        entity.setBaseDailySalary(dto.getBaseDailySalary());
        entity.setOvertimeHourlyRate(dto.getOvertimeHourlyRate());
        // 新增司机默认密码 123456，未修改密码标志
        entity.setPassword(passwordEncoder.encode("123456"));
        entity.setPasswordChanged(0);
        // 新增司机一定是在职的
        entity.setIsActive(1);
        driverMapper.insert(entity);
        log.info("新增司机成功: driverId={}, name={}", entity.getId(), entity.getRealName());
        anomalyRecordService.checkDriverNameDuplicate(entity.getId(), entity.getRealName());
        return entity.getId();
    }

    @Override
    public IPage<DriverListVO> list(DriverQuery query) {
        Page<DriverEntity> page = new Page<>(query.getPageNum(), query.getPageSize());
        LambdaQueryWrapper<DriverEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DriverEntity::getIsActive, query.getIsActive());
        if (StringUtils.hasText(query.getKeyword())) {
            wrapper.like(DriverEntity::getRealName, query.getKeyword());
        }
        if (query.getGender() != null) {
            wrapper.eq(DriverEntity::getGender, query.getGender());
        }
        wrapper.orderByDesc(DriverEntity::getCreateTime);

        IPage<DriverEntity> entityPage = driverMapper.selectPage(page, wrapper);
        List<DriverListVO> voList = entityPage.getRecords().stream()
                .map(this::convertToListVO)
                .collect(Collectors.toList());

        Page<DriverListVO> resultPage = new Page<>(entityPage.getCurrent(), entityPage.getSize(), entityPage.getTotal());
        resultPage.setRecords(voList);
        return resultPage;
    }

    @Override
    public DriverDetailVO detail(Long id) {
        DriverEntity entity = driverMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "司机不存在");
        }
        return convertToDetailVO(entity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(Long id, UpdateDriverDTO dto) {
        DriverEntity entity = driverMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "司机不存在");
        }
        BeanUtils.copyProperties(dto, entity);
        // 空字符串转 null，避免唯一索引 uk_phone 冲突
        entity.setPhone(blankToNull(entity.getPhone()));
        entity.setIdCard(blankToNull(entity.getIdCard()));
        entity.setEmergencyContactPhone(blankToNull(entity.getEmergencyContactPhone()));
        driverMapper.updateById(entity);
        log.info("修改司机信息成功: driverId={}", id);
        anomalyRecordService.checkDriverNameDuplicate(entity.getId(), entity.getRealName());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void resign(Long id) {
        DriverEntity entity = driverMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "司机不存在");
        }
        if (entity.getIsActive() != null && entity.getIsActive() == 0) {
            throw new BusinessException(ResultCodeEnum.BUSINESS_ERROR, "该司机已离职");
        }
        entity.setIsActive(0);
        driverMapper.updateById(entity);
        log.info("司机离职成功: driverId={}", id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int deleteDriver(Long id) {
        DriverEntity entity = driverMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "司机不存在");
        }
        LambdaQueryWrapper<com.green.module.attendance.entity.DriverAttendanceRecordEntity> countWrapper = new LambdaQueryWrapper<>();
        countWrapper.eq(com.green.module.attendance.entity.DriverAttendanceRecordEntity::getDriverId, id);
        Long attendanceCount = driverAttendanceRecordMapper.selectCount(countWrapper);
        if (attendanceCount > 0) {
            LambdaQueryWrapper<com.green.module.attendance.entity.DriverAttendanceRecordEntity> deleteWrapper = new LambdaQueryWrapper<>();
            deleteWrapper.eq(com.green.module.attendance.entity.DriverAttendanceRecordEntity::getDriverId, id);
            driverAttendanceRecordMapper.delete(deleteWrapper);
            log.info("删除司机关联考勤记录: driverId={}, count={}", id, attendanceCount);
        }
        driverMapper.deleteById(id);
        log.info("删除司机成功: driverId={}", id);
        return attendanceCount.intValue();
    }

    /**
     * 将空白字符串转为 null
     */
    private String blankToNull(String value) {
        return StringUtils.hasText(value) ? value : null;
    }

    private DriverListVO convertToListVO(DriverEntity entity) {
        DriverListVO vo = new DriverListVO();
        vo.setId(entity.getId());
        vo.setRealName(entity.getRealName());
        vo.setGenderText(entity.getGender() != null && entity.getGender() == 1 ? "男" : "女");
        vo.setPhone(entity.getPhone());
        vo.setBaseDailySalary(entity.getBaseDailySalary());
        vo.setOvertimeHourlyRate(entity.getOvertimeHourlyRate());
        vo.setIsActive(entity.getIsActive());
        return vo;
    }

    private DriverDetailVO convertToDetailVO(DriverEntity entity) {
        DriverDetailVO vo = new DriverDetailVO();
        vo.setId(entity.getId());
        vo.setRealName(entity.getRealName());
        vo.setGenderText(entity.getGender() != null && entity.getGender() == 1 ? "男" : "女");
        vo.setPhone(entity.getPhone());
        vo.setBaseDailySalary(entity.getBaseDailySalary());
        vo.setOvertimeHourlyRate(entity.getOvertimeHourlyRate());
        vo.setWxOpenid(entity.getWxOpenid());
        vo.setIsActiveText(entity.getIsActive() != null && entity.getIsActive() == 1 ? "在职" : "离职");
        vo.setPasswordChanged(entity.getPasswordChanged());
        vo.setCreateTime(entity.getCreateTime());
        return vo;
    }
}
