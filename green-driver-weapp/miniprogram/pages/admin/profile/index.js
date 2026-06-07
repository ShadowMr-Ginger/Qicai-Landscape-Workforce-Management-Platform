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
        userInfo: null,
        avatarText: '管',
        displayName: '管理员',
    },
    onShow() {
        this.loadUserInfo();
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({ selected: 3 });
        }
    },
    loadUserInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const stored = (0, auth_1.getUserInfo)();
            if (stored) {
                const name = stored.name || stored.realName || '管理员';
                this.setData({ userInfo: stored, avatarText: name.charAt(0), displayName: name });
            }
            try {
                const user = yield (0, api_1.getCurrentUser)();
                if (user) {
                    const name = user.name || user.realName || '管理员';
                    this.setData({ userInfo: user, avatarText: name.charAt(0), displayName: name });
                }
            }
            catch (err) {
                console.error('获取用户信息失败', err);
            }
        });
    },
    logout() {
        wx.showModal({
            title: '确认退出',
            content: '确定退出登录？',
            success: (res) => {
                if (res.confirm) {
                    (0, auth_1.clearLoginState)();
                    wx.reLaunch({ url: '/pages/index/index' });
                }
            },
        });
    },
});
