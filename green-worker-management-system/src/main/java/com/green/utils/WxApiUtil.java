package com.green.utils;

import cn.hutool.http.HttpUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 微信 API 工具类
 *
 * <p>封装微信小程序相关的微信服务端接口调用。</p>
 * <p>当前预留核心方法：微信登录凭证校验（code2session）。</p>
 *
 * <h3>调用流程</h3>
 * <ol>
 *     <li>小程序前端调用 wx.login() 获取临时 code</li>
 *     <li>将 code 发送到后端</li>
 *     <li>后端调用微信接口换取 OpenID 和 SessionKey</li>
 *     <li>后端将 OpenID 与司机账号绑定</li>
 * </ol>
 *
 * @author Green Team
 * @version 1.0.0
 */
@Slf4j
@Component
public class WxApiUtil {

    /**
     * 微信小程序 AppID
     */
    @Value("${wx.miniapp.app-id:}")
    private String appId;

    /**
     * 微信小程序 AppSecret
     */
    @Value("${wx.miniapp.app-secret:}")
    private String appSecret;

    /**
     * 微信登录凭证校验接口地址
     */
    private static final String CODE_TO_SESSION_URL =
            "https://api.weixin.qq.com/sns/jscode2session";

    /**
     * 通过小程序临时登录凭证 code 换取 OpenID 和 SessionKey
     *
     * @param code 小程序前端调用 wx.login() 获取的 code
     * @return 包含 openid 和 session_key 的 JSON 对象
     */
    public JSONObject code2Session(String code) {
        String url = CODE_TO_SESSION_URL + "?appid=" + appId
                + "&secret=" + appSecret
                + "&js_code=" + code
                + "&grant_type=authorization_code";

        try {
            String response = HttpUtil.get(url, 5000);
            JSONObject json = JSONUtil.parseObj(response);

            if (json.containsKey("errcode")) {
                log.error("微信接口调用失败: errcode={}, errmsg={}",
                        json.getStr("errcode"), json.getStr("errmsg"));
                return null;
            }

            return json;
        } catch (Exception e) {
            log.error("调用微信 code2session 接口异常", e);
            return null;
        }
    }

    /**
     * 获取微信小程序 AccessToken（预留，用于服务端推送消息等场景）
     *
     * @return AccessToken 字符串
     */
    public String getAccessToken() {
        String url = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential"
                + "&appid=" + appId + "&secret=" + appSecret;
        try {
            String response = HttpUtil.get(url, 5000);
            JSONObject json = JSONUtil.parseObj(response);
            return json.getStr("access_token");
        } catch (Exception e) {
            log.error("获取微信 AccessToken 异常", e);
            return null;
        }
    }
}
