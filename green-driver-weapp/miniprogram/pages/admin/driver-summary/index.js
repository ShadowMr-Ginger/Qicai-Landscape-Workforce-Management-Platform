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
        drivers: [],
        loading: false,
    },
    onLoad() {
        this.loadDrivers();
    },
    onPullDownRefresh() {
        this.loadDrivers().finally(() => wx.stopPullDownRefresh());
    },
    loadDrivers() {
        return __awaiter(this, void 0, void 0, function* () {
            this.setData({ loading: true });
            try {
                const res = yield (0, api_1.getAdminDrivers)();
                const driverList = (res === null || res === void 0 ? void 0 : res.records) || res || [];
                this.setData({ drivers: driverList.map((d) => (Object.assign(Object.assign({}, d), { summary: null, _summaryLoaded: false }))) });
                this.loadAllSummaries();
            }
            catch (err) {
                console.error('加载司机失败', err);
            }
            finally {
                this.setData({ loading: false });
            }
        });
    },
    loadAllSummaries() {
        return __awaiter(this, void 0, void 0, function* () {
            const drivers = [...this.data.drivers];
            yield Promise.all(drivers.map((d) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const summary = yield (0, api_1.getDriverWageSummary)(d.id);
                    d.summary = summary;
                    d._summaryLoaded = true;
                }
                catch (err) {
                    console.error('加载汇总失败', err);
                }
            })));
            this.setData({ drivers });
        });
    },
});
