package com.green.module.driver.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.green.module.auth.dto.AdminResetDriverPasswordDTO;
import com.green.module.auth.dto.DriverChangePasswordDTO;
import com.green.module.driver.dto.CreateDriverDTO;
import com.green.module.driver.dto.DriverQuery;
import com.green.module.driver.dto.UpdateDriverDTO;
import com.green.module.driver.vo.DriverDetailVO;
import com.green.module.driver.vo.DriverListVO;

/**
 * 司机服务接口
 *
 * @author Green Team
 * @version 1.0.0
 */
public interface DriverService {

    // ==================== 认证相关 ====================

    void changePassword(DriverChangePasswordDTO dto);

    void resetPassword(AdminResetDriverPasswordDTO dto);

    // ==================== 管理相关 ====================

    Long create(CreateDriverDTO dto);

    IPage<DriverListVO> list(DriverQuery query);

    DriverDetailVO detail(Long id);

    void update(Long id, UpdateDriverDTO dto);

    void resign(Long id);

    int deleteDriver(Long id);
}
