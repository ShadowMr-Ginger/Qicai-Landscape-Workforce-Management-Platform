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
        loading: false,
        statusFilter: '0',
        dateFrom: '',
        dateTo: '',
    },
    onLoad() {
        this.loadBatches();
    },
    onShow() {
        this.loadBatches();
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({ selected: 1 });
        }
    },
    onPullDownRefresh() {
        this.loadBatches().finally(() => wx.stopPullDownRefresh());
    },
    loadBatches() {
        return __awaiter(this, void 0, void 0, function* () {
            this.setData({ loading: true });
            try {
                const params = { pageSize: 100 };
                if (this.data.statusFilter !== '')
                    params.status = this.data.statusFilter;
                if (this.data.dateFrom)
                    params.dateFrom = this.data.dateFrom;
                if (this.data.dateTo)
                    params.dateTo = this.data.dateTo;
                const res = yield (0, api_1.getAdminBatches)(params);
                const rawList = (res === null || res === void 0 ? void 0 : res.records) || res || [];
                // 预处理每个 item，避免 WXML 中频繁方法调用
                const list = rawList.map((item) => (Object.assign(Object.assign({}, item), { _cardClass: this.getCardClass(item.status), _statusText: this.getStatusText(item.status), _statusClass: this.getStatusClass(item.status) })));
                this.setData({ batches: list });
            }
            catch (err) {
                console.error('加载批次失败', err);
            }
            finally {
                this.setData({ loading: false });
            }
        });
    },
    onStatusChange(e) {
        const statusMap = ['', '0', '1', '2', '3'];
        this.setData({ statusFilter: statusMap[e.detail.value] || '' });
        this.loadBatches();
    },
    onDateFromChange(e) {
        this.setData({ dateFrom: e.detail.value });
        this.loadBatches();
    },
    onDateToChange(e) {
        this.setData({ dateTo: e.detail.value });
        this.loadBatches();
    },
    resetFilter() {
        this.setData({ statusFilter: '0', dateFrom: '', dateTo: '' });
        this.loadBatches();
    },
    goDetail(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({ url: `/pages/admin/batch-review-detail/index?id=${id}` });
    },
    getStatusText(status) {
        return constants_1.BATCH_STATUS_TEXT[Number(status)] || '未知';
    },
    getStatusClass(status) {
        return constants_1.BATCH_STATUS_COLOR[Number(status)] || '';
    },
    getCardClass(status) {
        const map = {
            0: 'card-pending',
            1: 'card-approved',
            2: 'card-withdrawn',
            3: 'card-rejected',
        };
        return map[Number(status)] || '';
    },
});
