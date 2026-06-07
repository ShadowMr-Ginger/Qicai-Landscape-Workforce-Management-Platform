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
const constants_1 = require("../../../utils/constants");
Page({
    data: {
        userInfo: null,
        displayName: '司机',
        avatarLetter: '司',
        todayStr: '',
        draftCount: 0,
        pendingCount: 0,
        approvedCount: 0,
    },
    onLoad() {
        this.setTodayStr();
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
        this.loadBatchStats();
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({ selected: 0 });
        }
    },
    setTodayStr() {
        const now = new Date();
        const str = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
        this.setData({ todayStr: str });
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
    loadBatchStats() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const list = yield (0, api_1.getDriverBatches)();
                const draftCount = list.filter(b => b.status === constants_1.BATCH_STATUS.PENDING || b.status === constants_1.BATCH_STATUS.WITHDRAWN).length;
                const pendingCount = list.filter(b => b.status === constants_1.BATCH_STATUS.PENDING).length;
                const approvedCount = list.filter(b => b.status === constants_1.BATCH_STATUS.APPROVED).length;
                this.setData({ draftCount, pendingCount, approvedCount });
            }
            catch (err) {
                console.error('获取批次统计失败', err);
            }
        });
    },
    /** 上报考勤 */
    goCreateBatch() {
        wx.navigateTo({ url: '/pages/driver/batch-create/index' });
    },
    /** 批次记录 */
    goBatchList() {
        wx.switchTab({ url: '/pages/driver/batch-list/index' });
    },
    /** 常用工人 */
    goWorkers() {
        wx.switchTab({ url: '/pages/driver/workers/index' });
    },
    /** 个人中心 */
    goProfile() {
        wx.switchTab({ url: '/pages/driver/profile/index' });
    },
});
