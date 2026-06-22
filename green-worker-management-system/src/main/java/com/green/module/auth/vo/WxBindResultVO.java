package com.green.module.auth.vo;

import lombok.Data;

/**
 * 微信绑定结果
 *
 * <p>用于司机/管理员绑定微信时，前端判断当前账号与当前微信的绑定关系。</p>
 */
@Data
public class WxBindResultVO {

    /**
     * 绑定状态
     * <ul>
     *     <li>BOUND_SUCCESS - 绑定成功</li>
     *     <li>BOUND_SELF - 该账号已绑定当前微信</li>
     *     <li>BOUND_OTHER - 该账号已绑定其他微信，需要用户确认后重新绑定</li>
     * </ul>
     */
    private String status;

    /**
     * 当前微信的 OpenID（脱敏后）
     */
    private String currentOpenid;

    /**
     * 当前账号已绑定的 OpenID（脱敏后）
     */
    private String boundOpenid;

    public static WxBindResultVO success(String currentOpenid) {
        WxBindResultVO vo = new WxBindResultVO();
        vo.setStatus("BOUND_SUCCESS");
        vo.setCurrentOpenid(currentOpenid);
        return vo;
    }

    public static WxBindResultVO self(String currentOpenid) {
        WxBindResultVO vo = new WxBindResultVO();
        vo.setStatus("BOUND_SELF");
        vo.setCurrentOpenid(currentOpenid);
        vo.setBoundOpenid(currentOpenid);
        return vo;
    }

    public static WxBindResultVO other(String currentOpenid, String boundOpenid) {
        WxBindResultVO vo = new WxBindResultVO();
        vo.setStatus("BOUND_OTHER");
        vo.setCurrentOpenid(currentOpenid);
        vo.setBoundOpenid(boundOpenid);
        return vo;
    }
}
