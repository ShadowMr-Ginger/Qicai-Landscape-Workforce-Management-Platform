package com.green.module.system.controller;

import cn.hutool.json.JSONObject;
import com.green.common.result.ApiResult;
import com.green.module.system.entity.AdminEntity;
import com.green.module.system.mapper.AdminMapper;
import com.green.utils.SecurityUtils;
import com.green.utils.WxApiUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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
    public ApiResult<Void> bindWechat(@RequestBody Map<String, String> dto) {
        String wxCode = dto.get("wxCode");
        JSONObject wxResult = wxApiUtil.code2Session(wxCode);
        if (wxResult == null) {
            return ApiResult.error(500, "微信授权失败");
        }
        String openid = wxResult.getStr("openid");
        if (openid == null || openid.isEmpty()) {
            return ApiResult.error(500, "获取微信OpenID失败");
        }

        Long adminId = SecurityUtils.getCurrentUserId();
        AdminEntity admin = adminMapper.selectById(adminId);
        if (admin == null) {
            return ApiResult.error(404, "管理员不存在");
        }

        admin.setWxOpenid(openid);
        adminMapper.updateById(admin);
        return ApiResult.success("绑定成功");
    }
}
