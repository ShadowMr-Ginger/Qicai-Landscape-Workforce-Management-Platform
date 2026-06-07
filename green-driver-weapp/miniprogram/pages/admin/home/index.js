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
        todayDate: '',
        pendingCount: 0,
        todayWorkerRecords: 0,
        todayDriverRecords: 0,
        totalWorkers: 0,
        totalDrivers: 0,
        loading: false,
    },
    onLoad() {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        this.setData({ todayDate: todayStr });
        this.loadUserInfo();
        this.loadStats();
    },
    onShow() {
        this.loadStats();
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({ selected: 0 });
        }
    },
    onPullDownRefresh() {
        Promise.all([this.loadUserInfo(), this.loadStats()]).finally(() => {
            wx.stopPullDownRefresh();
        });
    },
    loadUserInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const stored = (0, auth_1.getUserInfo)();
            if (stored) {
                const name = stored.name || stored.realName || '管理员';
                this.setData({ userInfo: stored, avatarText: name.charAt(0) });
            }
            try {
                const user = yield (0, api_1.getCurrentUser)();
                if (user) {
                    const name = user.name || user.realName || '管理员';
                    this.setData({ userInfo: user, avatarText: name.charAt(0) });
                }
            }
            catch (err) {
                console.error('获取用户信息失败', err);
            }
        });
    },
    loadStats() {
        return __awaiter(this, void 0, void 0, function* () {
            this.setData({ loading: true });
            try {
                const stats = yield (0, api_1.getAdminDashboardStats)();
                this.setData({
                    pendingCount: (stats === null || stats === void 0 ? void 0 : stats.pendingCount) || 0,
                    todayWorkerRecords: (stats === null || stats === void 0 ? void 0 : stats.todayWorkerRecords) || 0,
                    todayDriverRecords: (stats === null || stats === void 0 ? void 0 : stats.todayDriverRecords) || 0,
                    totalWorkers: (stats === null || stats === void 0 ? void 0 : stats.totalWorkers) || 0,
                    totalDrivers: (stats === null || stats === void 0 ? void 0 : stats.totalDrivers) || 0,
                });
            }
            catch (err) {
                console.error('加载统计失败', err);
            }
            finally {
                this.setData({ loading: false });
            }
        });
    },
    goBatchReview() {
        wx.switchTab({ url: '/pages/admin/batch-review/index' });
    },
    goWorkerRecords() {
        wx.navigateTo({ url: '/pages/admin/worker-records/index' });
    },
    goDriverRecords() {
        wx.navigateTo({ url: '/pages/admin/driver-records/index' });
    },
    goAttendanceRecords() {
        wx.switchTab({ url: '/pages/admin/attendance-records/index' });
    },
});
