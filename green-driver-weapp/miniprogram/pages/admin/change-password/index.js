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
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
        loading: false,
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
            const { oldPassword, newPassword, confirmPassword } = this.data;
            if (!oldPassword) {
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
                yield (0, api_1.adminChangePassword)(oldPassword, newPassword);
                wx.showToast({ title: '修改成功', icon: 'success' });
                setTimeout(() => {
                    wx.navigateBack();
                }, 1500);
            }
            catch (err) {
                wx.showToast({ title: err.message || '修改失败', icon: 'none' });
            }
            finally {
                this.setData({ loading: false });
            }
        });
    },
});
