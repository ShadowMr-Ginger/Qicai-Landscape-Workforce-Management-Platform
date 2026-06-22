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
        boundOpenid: '',
    },
    onLoad() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield (0, api_1.getCurrentUser)();
                if (user === null || user === void 0 ? void 0 : user.wxOpenid) {
                    this.setData({ boundOpenid: user.wxOpenid });
                }
            }
            catch (_a) {
                // ignore
            }
        });
    },
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
                yield this.doBind(wxRes.code);
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
    doBind(wxCode, confirm) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, api_1.bindWechat)(wxCode, confirm);
            if ((result === null || result === void 0 ? void 0 : result.status) === 'BOUND_SELF') {
                wx.showToast({ title: '该账号已与当前微信号绑定', icon: 'none' });
                (0, auth_1.setWxBound)(true);
                setTimeout(() => {
                    wx.switchTab({ url: '/pages/driver/home/index' });
                }, 1500);
                return;
            }
            if ((result === null || result === void 0 ? void 0 : result.status) === 'BOUND_OTHER') {
                const boundOpenid = result.boundOpenid || '其他微信';
                wx.showModal({
                    title: '确认重新绑定',
                    content: `该账号已绑定微信（${boundOpenid}），继续绑定当前账号将解除之前绑定的账号，是否继续？`,
                    confirmText: '继续绑定',
                    cancelText: '取消',
                    success: (res) => __awaiter(this, void 0, void 0, function* () {
                        if (res.confirm) {
                            try {
                                this.setData({ loading: true });
                                yield this.doBind(wxCode, true);
                            }
                            catch (err) {
                                wx.showToast({ title: err.message || '绑定失败', icon: 'none' });
                            }
                            finally {
                                this.setData({ loading: false });
                            }
                        }
                    }),
                });
                return;
            }
            // BOUND_SUCCESS
            (0, auth_1.setWxBound)(true);
            wx.showToast({ title: '绑定成功', icon: 'success' });
            setTimeout(() => {
                wx.switchTab({ url: '/pages/driver/home/index' });
            }, 1500);
        });
    },
    onSkip() {
        wx.switchTab({ url: '/pages/driver/home/index' });
    },
});
