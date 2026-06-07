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
Page({
    data: {
        firstLogin: false,
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
        loading: false,
    },
    onLoad(options) {
        this.setData({ firstLogin: options.firstLogin === 'true' });
    },
    onOldPasswordInput(e) {
        this.setData({ oldPassword: e.detail.value });
    },
    onNewPasswordInput(e) {
        this.setData({ newPassword: e.detail.value });
    },
    onConfirmPasswordInput(e) {
        this.setData({ confirmPassword: e.detail.value });
    },
    onSubmit() {
        return __awaiter(this, void 0, void 0, function* () {
            const { firstLogin, oldPassword, newPassword, confirmPassword } = this.data;
            if (!firstLogin && !oldPassword) {
                wx.showToast({ title: '请输入原密码', icon: 'none' });
                return;
            }
            if (!newPassword || newPassword.length < 6) {
                wx.showToast({ title: '新密码至少6位', icon: 'none' });
                return;
            }
            if (newPassword !== confirmPassword) {
                wx.showToast({ title: '两次密码不一致', icon: 'none' });
                return;
            }
            this.setData({ loading: true });
            try {
                const newToken = yield (0, api_1.driverChangePassword)(firstLogin ? '123456' : oldPassword, newPassword);
                wx.showToast({ title: '修改成功', icon: 'success' });
                // 保存新 Token，更新 passwordChanged 状态
                if (newToken) {
                    wx.setStorageSync('token', newToken);
                    const userInfo = wx.getStorageSync('userInfo') || {};
                    userInfo.passwordChanged = true;
                    wx.setStorageSync('userInfo', userInfo);
                }
                if (firstLogin) {
                    // 跳转到微信绑定
                    setTimeout(() => {
                        wx.redirectTo({ url: '/pages/driver/wechat-bind/index' });
                    }, 1500);
                }
                else {
                    setTimeout(() => {
                        wx.navigateBack();
                    }, 1500);
                }
            }
            catch (err) {
                console.error('修改密码失败', err);
            }
            finally {
                this.setData({ loading: false });
            }
        });
    },
});
