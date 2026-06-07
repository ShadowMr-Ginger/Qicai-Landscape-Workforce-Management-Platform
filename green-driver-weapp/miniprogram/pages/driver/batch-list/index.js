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
const constants_1 = require("../../../utils/constants");
Page({
    data: {
        batches: [],
        filteredBatches: [],
        loading: false,
        activeTab: 0, // 0-草稿(待审核+已撤回) 1-历史(已通过+不通过)
        tabOptions: ['草稿', '历史记录'],
        // 详情弹窗
        showDetail: false,
        detailBatch: null,
        detailWorkers: [],
    },
    onLoad() {
        this.loadBatches();
    },
    onShow() {
        // 每次显示都刷新数据（兼容 onShow 不触发的情况）
        this.loadBatches();
        const app = getApp();
        if (app && app.globalData) {
            app.globalData._refreshBatchList = false;
        }
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({ selected: 1 });
        }
    },
    /** 页面可见时强制刷新（兼容 onShow 不触发的情况） */
    forceRefresh() {
        this.loadBatches();
    },
    onPullDownRefresh() {
        this.loadBatches().finally(() => {
            wx.stopPullDownRefresh();
        });
    },
    loadBatches() {
        return __awaiter(this, void 0, void 0, function* () {
            this.setData({ loading: true });
            try {
                const list = yield (0, api_1.getDriverBatches)();
                const batches = list || [];
                this.setData({ batches });
                this.updateFilteredBatches(batches, this.data.activeTab);
            }
            catch (err) {
                console.error('加载批次失败', err);
            }
            finally {
                this.setData({ loading: false });
            }
        });
    },
    /** 显式刷新按钮 */
    onRefreshTap() {
        this.loadBatches();
    },
    updateFilteredBatches(batches, activeTab) {
        if (activeTab === 0) {
            this.setData({
                filteredBatches: batches.filter(b => Number(b.status) === constants_1.BATCH_STATUS.PENDING || Number(b.status) === constants_1.BATCH_STATUS.WITHDRAWN)
            });
        }
        else {
            this.setData({
                filteredBatches: batches.filter(b => Number(b.status) === constants_1.BATCH_STATUS.APPROVED || Number(b.status) === constants_1.BATCH_STATUS.REJECTED)
            });
        }
    },
    switchTab(e) {
        const activeTab = parseInt(e.currentTarget.dataset.index);
        this.setData({ activeTab });
        this.updateFilteredBatches(this.data.batches, activeTab);
    },
    getStatusClass(status) {
        return constants_1.BATCH_STATUS_COLOR[Number(status)] || '';
    },
    getStatusText(status) {
        return constants_1.BATCH_STATUS_TEXT[Number(status)] || '未知';
    },
    preventBubble() {
        // 阻止事件冒泡
    },
    /** 撤回批次 */
    onWithdraw(e) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = e.currentTarget.dataset.id;
            wx.showModal({
                title: '确认撤回',
                content: '撤回后批次将变为草稿状态，可重新编辑',
                confirmColor: '#16a34a',
                success: (res) => __awaiter(this, void 0, void 0, function* () {
                    if (res.confirm) {
                        try {
                            yield (0, api_1.withdrawBatch)(id);
                            wx.showToast({ title: '撤回成功', icon: 'success' });
                            this.loadBatches();
                        }
                        catch (err) {
                            wx.showToast({ title: err.message || '撤回失败', icon: 'none' });
                        }
                    }
                }),
            });
        });
    },
    /** 删除批次 */
    onDelete(e) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = e.currentTarget.dataset.id;
            wx.showModal({
                title: '确认删除',
                content: '删除后不可恢复，确定删除此批次？',
                confirmColor: '#ef4444',
                success: (res) => __awaiter(this, void 0, void 0, function* () {
                    if (res.confirm) {
                        try {
                            yield (0, api_1.deleteDriverBatch)(id);
                            wx.showToast({ title: '删除成功', icon: 'success' });
                            this.loadBatches();
                        }
                        catch (err) {
                            wx.showToast({ title: err.message || '删除失败', icon: 'none' });
                        }
                    }
                }),
            });
        });
    },
    /** 打开批次详情 */
    openDetail(e) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = Number(e.currentTarget.dataset.id);
            const batch = this.data.filteredBatches.find((b) => Number(b.id) === id);
            try {
                const detail = yield (0, api_1.getDriverBatchDetail)(id);
                const workers = (detail && Array.isArray(detail.workerRecords)) ? detail.workerRecords : [];
                const cleanWorkers = JSON.parse(JSON.stringify(workers));
                // 合并详情接口返回的数据，确保状态等字段最新
                const detailBatch = detail ? Object.assign(Object.assign({}, batch), detail) : batch;
                console.log('批次详情工人数量:', cleanWorkers.length, cleanWorkers);
                this.setData({ showDetail: true, detailBatch: detailBatch || null, detailWorkers: cleanWorkers });
            }
            catch (err) {
                console.error('加载详情失败', err);
                this.setData({ showDetail: true, detailBatch: batch || null, detailWorkers: [] });
            }
        });
    },
    closeDetail() {
        this.setData({ showDetail: false, detailBatch: null, detailWorkers: [] });
    },
    getAttendanceTypeText(type) {
        return constants_1.ATTENDANCE_TYPE_TEXT[type] || '未知';
    },
    /** 重新编辑（已撤回的批次） */
    onEdit(e) {
        const batch = e.currentTarget.dataset.batch;
        wx.navigateTo({
            url: `/pages/driver/batch-create/index?editMode=true&batchId=${batch.id}`,
        });
    },
});
