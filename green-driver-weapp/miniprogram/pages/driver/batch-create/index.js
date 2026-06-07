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
        // 批次设置
        attendanceType: constants_1.ATTENDANCE_TYPE.FULL,
        overtimeHours: 0,
        workTypeId: null,
        remark: '',
        workTypeOptions: [],
        // 工人选择
        favoriteWorkers: [],
        selectedWorkers: [], // { workerId, workerName, attendanceType, overtimeHours, projectId, workTypeId, remark }
        selectedWorkerIdMap: {},
        searchKeyword: '',
        searchResults: [],
        showSearch: false,
        // UI状态
        loading: false,
        submitting: false,
        showWorkerPicker: false,
        editingWorkerIndex: -1,
        // 编辑单个工人的设置
        editAttendanceType: constants_1.ATTENDANCE_TYPE.FULL,
        editOvertimeHours: 0,
        editRemark: '',
        // 其他
        todayDate: '',
        workTypeIndex: 0,
        selectedWorkTypeName: '',
        // 编辑模式
        editMode: false,
        editBatchId: null,
    },
    onLoad(options) {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        this.setData({ todayDate: todayStr });
        this.loadFavoriteWorkers();
        this.loadWorkTypes();
        // 编辑模式：加载批次详情
        if (options.editMode === 'true' && options.batchId) {
            this.setData({ editMode: true, editBatchId: parseInt(options.batchId) });
            this.loadBatchDetail(parseInt(options.batchId));
        }
    },
    loadBatchDetail(batchId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.setData({ loading: true });
            try {
                const detail = yield (0, api_1.getDriverBatchDetail)(batchId);
                if (detail) {
                    // 回填批次设置
                    const workTypeIndex = this.data.workTypeOptions.findIndex((t) => t.id === detail.workTypeId);
                    this.setData({
                        attendanceType: detail.attendanceType,
                        overtimeHours: detail.overtimeHours || 0,
                        workTypeId: detail.workTypeId,
                        workTypeIndex: workTypeIndex >= 0 ? workTypeIndex : 0,
                        selectedWorkTypeName: workTypeIndex >= 0 ? this.data.workTypeOptions[workTypeIndex].typeName : '',
                        remark: detail.remark || '',
                    });
                    // 回填工人（如果后端返回了工人记录）
                    if (detail.records && detail.records.length > 0) {
                        const selectedWorkers = detail.records.map((r) => ({
                            workerId: r.workerId,
                            workerName: r.workerName,
                            attendanceType: r.attendanceType,
                            overtimeHours: r.overtimeHours || 0,
                            projectId: r.projectId,
                            workTypeId: r.workTypeId,
                            remark: r.remark || '',
                        }));
                        const selectedWorkerIdMap = {};
                        selectedWorkers.forEach((w) => { selectedWorkerIdMap[w.workerId] = true; });
                        this.setData({ selectedWorkers, selectedWorkerIdMap });
                    }
                }
            }
            catch (err) {
                console.error('加载批次详情失败', err);
                wx.showToast({ title: '加载批次详情失败', icon: 'none' });
            }
            finally {
                this.setData({ loading: false });
            }
        });
    },
    loadFavoriteWorkers() {
        return __awaiter(this, void 0, void 0, function* () {
            this.setData({ loading: true });
            try {
                const list = yield (0, api_1.getFavoriteWorkers)();
                this.setData({ favoriteWorkers: list || [] });
            }
            catch (err) {
                console.error('加载常用工人失败', err);
            }
            finally {
                this.setData({ loading: false });
            }
        });
    },
    loadWorkTypes() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const list = yield (0, api_1.getWorkTypeList)();
                this.setData({ workTypeOptions: list || [] });
                // 默认选中"默认"作业类型
                const defaultType = (list || []).find((t) => t.typeName === '默认');
                if (defaultType) {
                    const index = (list || []).indexOf(defaultType);
                    this.setData({ workTypeId: defaultType.id, workTypeIndex: index, selectedWorkTypeName: defaultType.typeName });
                }
            }
            catch (err) {
                console.error('加载作业类型失败', err);
            }
        });
    },
    // ==================== 批次设置 ====================
    onAttendanceTypeChange(e) {
        const value = parseInt(e.detail.value);
        this.setData({ attendanceType: value });
        // 更新所有已选工人的出勤类型
        const selectedWorkers = this.data.selectedWorkers.map((w) => (Object.assign(Object.assign({}, w), { attendanceType: value })));
        this.setData({ selectedWorkers });
    },
    onOvertimeChange(e) {
        const index = parseInt(e.detail.value) || 0;
        const hours = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5][index] || 0;
        this.setData({ overtimeHours: hours });
        // 更新所有已选工人的加班时长
        const selectedWorkers = this.data.selectedWorkers.map((w) => (Object.assign(Object.assign({}, w), { overtimeHours: hours })));
        this.setData({ selectedWorkers });
    },
    onWorkTypeChange(e) {
        const index = parseInt(e.detail.value);
        const option = this.data.workTypeOptions[index];
        this.setData({ workTypeId: option ? option.id : null, workTypeIndex: index, selectedWorkTypeName: option ? option.typeName : '' });
    },
    onRemarkInput(e) {
        this.setData({ remark: e.detail.value });
    },
    // ==================== 工人选择 ====================
    toggleSearch() {
        this.setData({ showSearch: !this.data.showSearch, searchKeyword: '', searchResults: [] });
    },
    onSearchInput(e) {
        const value = e.detail.value;
        this.setData({ searchKeyword: value });
        // 清空输入时，清除搜索结果，不触发搜索
        if (!value || !value.trim()) {
            if (this.searchTimer)
                clearTimeout(this.searchTimer);
            this.setData({ searchResults: [] });
            return;
        }
        // 防抖自动搜索，每输入一个字符延迟 300ms 触发
        if (this.searchTimer)
            clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => {
            this.doSearch();
        }, 300);
    },
    doSearch() {
        return __awaiter(this, void 0, void 0, function* () {
            const keyword = this.data.searchKeyword.trim();
            try {
                const list = yield (0, api_1.searchAvailableWorkers)(keyword);
                // 过滤掉已选的工人
                const filtered = (list || []).filter((w) => !this.data.selectedWorkerIdMap[w.id]);
                this.setData({ searchResults: filtered });
            }
            catch (err) {
                console.error('搜索失败', err);
            }
        });
    },
    /** 从常用列表添加工人 */
    addFromFavorite(e) {
        const worker = e.currentTarget.dataset.worker;
        this.addWorker(worker);
    },
    /** 从搜索结果添加工人 */
    addFromSearch(e) {
        const worker = e.currentTarget.dataset.worker;
        this.addWorker(worker);
        this.setData({ showSearch: false, searchKeyword: '', searchResults: [] });
    },
    addWorker(worker) {
        if (this.data.selectedWorkerIdMap[worker.id]) {
            wx.showToast({ title: '该工人已添加', icon: 'none' });
            return;
        }
        const newWorker = {
            workerId: worker.id,
            workerName: worker.name,
            attendanceType: this.data.attendanceType,
            overtimeHours: this.data.overtimeHours,
            projectId: null,
            workTypeId: this.data.workTypeId,
            remark: '',
        };
        const selectedWorkerIdMap = Object.assign(Object.assign({}, this.data.selectedWorkerIdMap), { [worker.id]: true });
        this.setData({
            selectedWorkers: [...this.data.selectedWorkers, newWorker],
            selectedWorkerIdMap,
        });
    },
    /** 移除已选工人 */
    removeWorker(e) {
        const index = e.currentTarget.dataset.index;
        const selectedWorkers = [...this.data.selectedWorkers];
        const removed = selectedWorkers.splice(index, 1)[0];
        const selectedWorkerIdMap = Object.assign({}, this.data.selectedWorkerIdMap);
        delete selectedWorkerIdMap[removed.workerId];
        this.setData({ selectedWorkers, selectedWorkerIdMap });
    },
    /** 打开单个工人编辑 */
    openWorkerEdit(e) {
        const index = e.currentTarget.dataset.index;
        const worker = this.data.selectedWorkers[index];
        this.setData({
            showWorkerPicker: true,
            editingWorkerIndex: index,
            editAttendanceType: worker.attendanceType,
            editOvertimeHours: worker.overtimeHours,
            editRemark: worker.remark || '',
        });
    },
    closeWorkerEdit() {
        this.setData({ showWorkerPicker: false, editingWorkerIndex: -1 });
    },
    onEditAttendanceChange(e) {
        this.setData({ editAttendanceType: parseInt(e.detail.value) });
    },
    onEditOvertimeChange(e) {
        const index = parseInt(e.detail.value) || 0;
        const hours = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5][index] || 0;
        this.setData({ editOvertimeHours: hours });
    },
    preventBubble() {
        // 阻止事件冒泡，无需执行任何逻辑
    },
    onEditRemarkInput(e) {
        this.setData({ editRemark: e.detail.value });
    },
    saveWorkerEdit() {
        const index = this.data.editingWorkerIndex;
        if (index < 0)
            return;
        const selectedWorkers = [...this.data.selectedWorkers];
        selectedWorkers[index] = Object.assign(Object.assign({}, selectedWorkers[index]), { attendanceType: this.data.editAttendanceType, overtimeHours: this.data.editOvertimeHours, remark: this.data.editRemark });
        this.setData({ selectedWorkers, showWorkerPicker: false, editingWorkerIndex: -1 });
    },
    // ==================== 提交 ====================
    onSubmit() {
        return __awaiter(this, void 0, void 0, function* () {
            const { selectedWorkers, workTypeId, remark } = this.data;
            if (selectedWorkers.length === 0) {
                wx.showToast({ title: '请至少选择一名工人', icon: 'none' });
                return;
            }
            this.setData({ submitting: true });
            try {
                const payload = {
                    workers: selectedWorkers.map((w) => ({
                        workerId: w.workerId,
                        attendanceType: w.attendanceType,
                        overtimeHours: w.overtimeHours,
                        workTypeId: w.workTypeId,
                        remark: w.remark,
                    })),
                    attendanceType: this.data.attendanceType,
                    overtimeHours: this.data.overtimeHours,
                    workTypeId,
                    remark,
                    batchDate: this.data.todayDate,
                };
                if (this.data.editMode && this.data.editBatchId) {
                    yield (0, api_1.updateDriverBatch)(this.data.editBatchId, payload);
                    wx.showToast({ title: '重新提交成功', icon: 'success' });
                }
                else {
                    yield (0, api_1.createDriverBatch)(payload);
                    wx.showToast({ title: '提交成功', icon: 'success' });
                }
                // 标记批次列表需要刷新
                const app = getApp();
                if (app && app.globalData) {
                    app.globalData._refreshBatchList = true;
                }
                setTimeout(() => {
                    wx.switchTab({ url: '/pages/driver/batch-list/index' });
                }, 1500);
            }
            catch (err) {
                const msg = err.message || '提交失败';
                wx.showToast({ title: msg, icon: 'none' });
            }
            finally {
                this.setData({ submitting: false });
            }
        });
    },
});
