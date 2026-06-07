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
        binding: false,
    },
    bindWechat() {
        return __awaiter(this, void 0, void 0, function* () {
            this.setData({ binding: true });
            try {
                const wxRes = yield new Promise((resolve, reject) => {
                    wx.login({ success: resolve, fail: reject });
                });
                if (!wxRes.code) {
                    wx.showToast({ title: '获取微信code失败', icon: 'none' });
                    return;
                }
                yield (0, api_1.bindAdminWechat)(wxRes.code);
                (0, auth_1.setWxBound)(true);
                wx.showToast({ title: '绑定成功', icon: 'success' });
                setTimeout(() => {
                    wx.switchTab({ url: '/pages/admin/home/index' });
                }, 1000);
            }
            catch (err) {
                wx.showToast({ title: err.message || '绑定失败', icon: 'none' });
            }
            finally {
                this.setData({ binding: false });
            }
        });
    },
    skipBind() {
        wx.switchTab({ url: '/pages/admin/home/index' });
    },
});
