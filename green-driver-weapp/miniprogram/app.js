"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
App({
    globalData: {
        apiBaseUrl: 'http://localhost:8080/api',
        userInfo: null,
        token: '',
        userType: '', // 'admin' | 'driver'
    },
    onLaunch() {
        console.log('App Launch');
        // 检查登录状态
        const token = wx.getStorageSync('token');
        const userType = wx.getStorageSync('userType');
        if (token && userType) {
            this.globalData.token = token;
            this.globalData.userType = userType;
        }
    },
    onShow() {
        console.log('App Show');
    },
    onHide() {
        console.log('App Hide');
    },
});
