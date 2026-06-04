package com.green.module.driver.service;

import com.green.module.auth.dto.AdminResetDriverPasswordDTO;
import com.green.module.auth.dto.DriverChangePasswordDTO;

/**
 * 司机服务接口
 *
 * <p>负责司机相关的业务操作，包括修改密码、管理员重置密码等。</p>
 *
 * @author Green Team
 * @version 1.0.0
 */
public interface DriverService {

    /**
     * 司机修改密码
     *
     * <p>司机首次登录后，必须通过此接口修改默认密码。</p>
     * <p>修改成功后，password_changed 字段自动更新为 1。</p>
     *
     * @param dto 修改密码参数
     */
    void changePassword(DriverChangePasswordDTO dto);

    /**
     * 管理员重置司机密码
     *
     * <p>将司机密码重置为默认密码 123456，并标记为未修改状态，
     * 司机下次登录时必须重新修改密码。</p>
     *
     * @param dto 重置密码参数
     */
    void resetPassword(AdminResetDriverPasswordDTO dto);
}
