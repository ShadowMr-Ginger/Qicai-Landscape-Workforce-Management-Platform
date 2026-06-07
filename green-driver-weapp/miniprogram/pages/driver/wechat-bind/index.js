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
        loading: false,
    },
    onLoad() { },
    onBindWx() {
        return __awaiter(this, void 0, void 0, function* () {
            this.setData({ loading: true });
            try {
                const wxRes = yield new Promise((resolve, reject) => {
                    wx.login({ success: resolve, fail: reject });
                });
                if (!wxRes.code) {
                    wx.showToast({ title: '微信授权失败', icon: 'none' });
                    return;
                }
                yield (0, api_1.bindWechat)(wxRes.code);
                (0, auth_1.setWxBound)(true);
                wx.showToast({ title: '绑定成功', icon: 'success' });
                setTimeout(() => {
                    wx.switchTab({ url: '/pages/driver/home/index' });
                }, 1500);
            }
            catch (err) {
                const msg = err.message || '绑定失败';
                wx.showToast({ title: msg, icon: 'none' });
            }
            finally {
                this.setData({ loading: false });
            }
        });
    },
    onSkip() {
        wx.switchTab({ url: '/pages/driver/home/index' });
    },
});
