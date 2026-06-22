package com.green.module.system.controller;

import cn.hutool.json.JSONObject;
import com.green.common.result.ApiResult;
import com.green.common.result.ResultCodeEnum;
import com.green.module.auth.vo.WxBindResultVO;
import com.green.module.system.dto.AdminWxBindDTO;
import com.green.module.system.entity.AdminEntity;
import com.green.module.system.mapper.AdminMapper;
import com.green.utils.SecurityUtils;
import com.green.utils.WxApiUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * 管理员微信绑定控制器
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminBindController {

    private final AdminMapper adminMapper;
    private final WxApiUtil wxApiUtil;

    /**
     * 绑定微信
     */
    @PostMapping("/bind-wx")
    public ApiResult<WxBindResultVO> bindWechat(@RequestBody @Valid AdminWxBindDTO dto) {
        JSONObject wxResult = wxApiUtil.code2Session(dto.getWxCode());
        if (wxResult == null) {
            return ApiResult.error(ResultCodeEnum.WX_BIND_FAILED, "微信授权失败");
        }
        String openid = wxResult.getStr("openid");
        if (openid == null || openid.isEmpty()) {
            return ApiResult.error(ResultCodeEnum.WX_BIND_FAILED, "获取微信OpenID失败");
        }

        Long adminId = SecurityUtils.getCurrentUserId();
        AdminEntity admin = adminMapper.selectById(adminId);
        if (admin == null) {
            return ApiResult.error(ResultCodeEnum.NOT_FOUND, "管理员不存在");
        }

        String maskedOpenid = maskOpenid(openid);
        String boundOpenid = admin.getWxOpenid();

        // 判断当前账号与当前微信的绑定关系
        if (boundOpenid != null && !boundOpenid.isEmpty()) {
            if (boundOpenid.equals(openid)) {
                return ApiResult.success(WxBindResultVO.self(maskedOpenid));
            }
            if (!Boolean.TRUE.equals(dto.getConfirm())) {
                return ApiResult.success(WxBindResultVO.other(maskedOpenid, maskOpenid(boundOpenid)));
            }
        }

        // 检查 OpenID 是否已被其他管理员绑定
        com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<AdminEntity> wrapper =
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<>();
        wrapper.eq(AdminEntity::getWxOpenid, openid)
                .ne(AdminEntity::getId, adminId);
        if (adminMapper.selectCount(wrapper) > 0) {
            return ApiResult.error(ResultCodeEnum.WX_BIND_FAILED, "该微信已绑定其他管理员账号");
        }

        admin.setWxOpenid(openid);
        adminMapper.updateById(admin);
        return ApiResult.success(WxBindResultVO.success(maskedOpenid));
    }

    private String maskOpenid(String openid) {
        if (openid == null || openid.length() < 8) {
            return openid;
        }
        return openid.substring(0, 4) + "****" + openid.substring(openid.length() - 4);
    }
}
