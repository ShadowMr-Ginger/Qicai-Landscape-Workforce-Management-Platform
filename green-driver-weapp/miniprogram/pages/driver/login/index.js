"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("../../../utils/api");
const auth_1 = require("../../../utils/auth");
Page({
    data: {
        name: '',
        password: '',
        loading: false,
        wxLoading: false,
    },
    onNameInput(e) {
        this.setData({ name: e.detail.value });
    },
    onPasswordInput(e) {
        this.setData({ password: e.detail.value });
    },
    /** 账号密码登录 */
    onLogin() {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, password } = this.data;
            if (!name.trim()) {
                wx.showToast({ title: '请输入姓名', icon: 'none' });
                return;
            }
            if (!password) {
                wx.showToast({ title: '请输入密码', icon: 'none' });
                return;
            }
            this.setData({ loading: true });
            try {
                const res = yield (0, api_1.driverLogin)(name.trim(), password);
                this.handleLoginSuccess(res);
            }
            catch (err) {
                console.error('登录失败', err);
            }
            finally {
                this.setData({ loading: false });
            }
        });
    },
    /** 微信登录 */
    onWxLogin() {
        return __awaiter(this, void 0, void 0, function* () {
            this.setData({ wxLoading: true });
            try {
                const wxRes = yield new Promise((resolve, reject) => {
                    wx.login({
                        success: resolve,
                        fail: reject,
                    });
                });
                if (!wxRes.code) {
                    wx.showToast({ title: '微信登录失败', icon: 'none' });
                    return;
                }
                const res = yield (0, api_1.driverWxLogin)(wxRes.code);
                (0, auth_1.setWxBound)(true);
                this.handleLoginSuccess(res);
            }
            catch (err) {
                const msg = err.message || '微信登录失败';
                wx.showToast({ title: msg, icon: 'none' });
            }
            finally {
                this.setData({ wxLoading: false });
            }
        });
    },
    /** 登录成功处理 */
    handleLoginSuccess(res) {
        const { token, userInfo, firstLogin } = res;
        (0, auth_1.saveLoginState)(token, 'driver', userInfo);
        if (firstLogin) {
            // 首次登录，强制修改密码
            wx.redirectTo({ url: '/pages/driver/change-password/index?firstLogin=true' });
        }
        else {
            // 检查是否已绑定微信
            const wxBound = wx.getStorageSync('wxBound');
            if (!wxBound) {
                wx.redirectTo({ url: '/pages/driver/wechat-bind/index' });
            }
            else {
                wx.switchTab({ url: '/pages/driver/home/index' });
            }
        }
    },
    /** 返回首页 */
    goBack() {
        wx.navigateBack();
    },
});
