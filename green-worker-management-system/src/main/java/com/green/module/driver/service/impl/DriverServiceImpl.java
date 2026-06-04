package com.green.module.driver.service.impl;

import com.green.common.constants.SystemConstants;
import com.green.common.exception.BusinessException;
import com.green.common.result.ResultCodeEnum;
import com.green.module.auth.dto.AdminResetDriverPasswordDTO;
import com.green.module.auth.dto.DriverChangePasswordDTO;
import com.green.module.driver.entity.DriverEntity;
import com.green.module.driver.mapper.DriverMapper;
import com.green.module.driver.service.DriverService;
import com.green.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 司机服务实现
 *
 * <p>实现司机密码修改、管理员重置密码等业务逻辑。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DriverServiceImpl implements DriverService {

    private final DriverMapper driverMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void changePassword(DriverChangePasswordDTO dto) {
        // 1. 获取当前登录司机ID
        Long driverId = SecurityUtils.getCurrentUserId();
        if (driverId == null) {
            throw new BusinessException(ResultCodeEnum.UNAUTHORIZED);
        }

        // 2. 查询司机信息
        DriverEntity driver = driverMapper.selectById(driverId);
        if (driver == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "司机不存在");
        }

        // 3. 校验旧密码是否正确
        if (!passwordEncoder.matches(dto.getOldPassword(), driver.getPassword())) {
            throw new BusinessException(ResultCodeEnum.OLD_PASSWORD_ERROR);
        }

        // 4. 校验新密码不能与旧密码相同
        if (passwordEncoder.matches(dto.getNewPassword(), driver.getPassword())) {
            throw new BusinessException(ResultCodeEnum.BUSINESS_ERROR, "新密码不能与旧密码相同");
        }

        // 5. 加密新密码并更新
        String encodedNewPassword = passwordEncoder.encode(dto.getNewPassword());
        driver.setPassword(encodedNewPassword);
        driver.setPasswordChanged(1); // 标记为已修改密码
        driverMapper.updateById(driver);

        log.info("司机修改密码成功: driverId={}", driverId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void resetPassword(AdminResetDriverPasswordDTO dto) {
        // 1. 查询司机是否存在
        DriverEntity driver = driverMapper.selectById(dto.getDriverId());
        if (driver == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_FOUND, "司机不存在");
        }

        // 2. 重置为默认密码 123456
        String defaultPassword = passwordEncoder.encode(SystemConstants.DRIVER_DEFAULT_PASSWORD);
        driver.setPassword(defaultPassword);
        driver.setPasswordChanged(0); // 标记为未修改密码，下次登录必须修改
        driverMapper.updateById(driver);

        log.info("管理员重置司机密码成功: driverId={}, adminId={}",
                dto.getDriverId(), SecurityUtils.getCurrentUserId());
    }
}
