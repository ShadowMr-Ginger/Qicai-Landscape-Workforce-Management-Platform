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
        anomalies: [],
        loading: false,
        checking: false,
        total: 0,
    },
    onLoad() {
        this.runCheck();
    },
    onPullDownRefresh() {
        this.runCheck().finally(() => wx.stopPullDownRefresh());
    },
    runCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            this.setData({ checking: true, loading: true });
            try {
                const checkRes = yield (0, api_1.runGlobalAnomalyCheck)();
                const affected = (checkRes === null || checkRes === void 0 ? void 0 : checkRes.affected) || 0;
                wx.showToast({ title: `发现 ${affected} 条异常`, icon: 'none' });
            }
            catch (err) {
                console.error('全局检测失败', err);
                wx.showToast({ title: '全局检测失败', icon: 'none' });
            }
            finally {
                this.setData({ checking: false });
            }
            yield this.loadAnomalies();
        });
    },
    loadAnomalies() {
        return __awaiter(this, void 0, void 0, function* () {
            this.setData({ loading: true });
            try {
                const res = yield (0, api_1.getAnomalyList)({ status: 0, pageSize: 999 });
                const list = (res === null || res === void 0 ? void 0 : res.records) || res || [];
                this.setData({
                    anomalies: list,
                    total: (res === null || res === void 0 ? void 0 : res.total) || list.length,
                });
            }
            catch (err) {
                console.error('加载异常记录失败', err);
                wx.showToast({ title: '加载异常记录失败', icon: 'none' });
            }
            finally {
                this.setData({ loading: false });
            }
        });
    },
});
