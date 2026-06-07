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
        displayName: '司机',
        avatarLetter: '司',
    },
    onLoad() {
        const userInfo = (0, auth_1.getUserInfo)();
        if (userInfo) {
            this.setData({
                userInfo,
                displayName: userInfo.name || '司机',
                avatarLetter: (userInfo.name || '司')[0],
            });
        }
    },
    onShow() {
        this.loadUserInfo();
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({ selected: 3 });
        }
    },
    loadUserInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const res = yield (0, api_1.getCurrentUser)();
                this.setData({
                    userInfo: res,
                    displayName: (res === null || res === void 0 ? void 0 : res.name) || '司机',
                    avatarLetter: ((res === null || res === void 0 ? void 0 : res.name) || '司')[0],
                });
            }
            catch (err) {
                console.error('获取用户信息失败', err);
            }
        });
    },
    /** 修改密码 */
    goChangePassword() {
        wx.navigateTo({ url: '/pages/driver/change-password/index' });
    },
    /** 绑定/换绑微信 */
    goBindWechat() {
        wx.navigateTo({ url: '/pages/driver/wechat-bind/index' });
    },
    /** 退出登录 */
    onLogout() {
        wx.showModal({
            title: '确认退出',
            content: '退出后需要重新登录',
            confirmColor: '#ef4444',
            success: (res) => __awaiter(this, void 0, void 0, function* () {
                if (res.confirm) {
                    try {
                        yield (0, api_1.logout)();
                    }
                    catch (err) {
                        // ignore
                    }
                    (0, auth_1.clearLoginState)();
                    wx.reLaunch({ url: '/pages/index/index' });
                }
            }),
        });
    },
});
