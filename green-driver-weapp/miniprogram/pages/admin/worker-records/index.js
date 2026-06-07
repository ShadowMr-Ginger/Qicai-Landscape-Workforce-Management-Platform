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
Page({
    data: {
        records: [],
        loading: false,
        workerName: '',
        dateFrom: '',
        dateTo: '',
    },
    onLoad() {
        this.loadRecords();
    },
    onPullDownRefresh() {
        this.loadRecords().finally(() => wx.stopPullDownRefresh());
    },
    loadRecords() {
        return __awaiter(this, void 0, void 0, function* () {
            this.setData({ loading: true });
            try {
                const params = { pageSize: 100 };
                if (this.data.workerName)
                    params.workerName = this.data.workerName;
                if (this.data.dateFrom)
                    params.dateFrom = this.data.dateFrom;
                if (this.data.dateTo)
                    params.dateTo = this.data.dateTo;
                const res = yield (0, api_1.getWorkerAttendanceRecords)(params);
                const list = (res === null || res === void 0 ? void 0 : res.records) || res || [];
                this.setData({ records: list });
            }
            catch (err) {
                console.error('加载记录失败', err);
            }
            finally {
                this.setData({ loading: false });
            }
        });
    },
    onNameInput(e) {
        this.setData({ workerName: e.detail.value });
    },
    onDateFromChange(e) {
        this.setData({ dateFrom: e.detail.value });
        this.loadRecords();
    },
    onDateToChange(e) {
        this.setData({ dateTo: e.detail.value });
        this.loadRecords();
    },
    doSearch() {
        this.loadRecords();
    },
    resetFilter() {
        this.setData({ workerName: '', dateFrom: '', dateTo: '' });
        this.loadRecords();
    },
});
