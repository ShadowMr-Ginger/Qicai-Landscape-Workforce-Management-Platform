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
        groups: [],
        loading: false,
    },
    onLoad() {
        this.loadWorkers();
    },
    onPullDownRefresh() {
        this.loadWorkers().finally(() => wx.stopPullDownRefresh());
    },
    loadWorkers() {
        return __awaiter(this, void 0, void 0, function* () {
            this.setData({ loading: true });
            try {
                const res = yield (0, api_1.getAdminWorkers)({ isEmployed: 1, pageSize: 1000 });
                const workerList = (res === null || res === void 0 ? void 0 : res.records) || res || [];
                // 按组别分组
                const groupMap = {};
                workerList.forEach((w) => {
                    const g = w.groupName || '未分组';
                    if (!groupMap[g])
                        groupMap[g] = [];
                    groupMap[g].push(w);
                });
                const groups = Object.entries(groupMap).map(([name, list]) => ({
                    name,
                    workers: list,
                    expanded: false,
                }));
                this.setData({ groups });
            }
            catch (err) {
                console.error('加载工人失败', err);
            }
            finally {
                this.setData({ loading: false });
            }
        });
    },
    toggleGroup(e) {
        var _a;
        const index = e.currentTarget.dataset.index;
        const groups = [...this.data.groups];
        groups[index].expanded = !groups[index].expanded;
        this.setData({ groups });
        if (groups[index].expanded && !((_a = groups[index].workers[0]) === null || _a === void 0 ? void 0 : _a._summaryLoaded)) {
            this.loadGroupSummaries(index);
        }
    },
    loadGroupSummaries(groupIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            const groups = [...this.data.groups];
            const workers = groups[groupIndex].workers;
            yield Promise.all(workers.map((w) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const summary = yield (0, api_1.getWorkerWageSummary)(w.id);
                    w.summary = summary;
                    w._summaryLoaded = true;
                }
                catch (err) {
                    console.error('加载汇总失败', err);
                }
            })));
            this.setData({ groups });
        });
    },
});
