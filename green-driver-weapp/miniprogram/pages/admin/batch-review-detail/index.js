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
        batchId: null,
        batch: null,
        workers: [],
        driverRecord: null,
        loading: false,
        submitting: false,
        // 工人编辑弹窗
        editPanelOpen: false,
        editingWorkerIndex: -1,
        editingWorker: null,
        attendanceTypeOptions: ['全天', '半天'],
        projectOptions: [],
        workTypeOptions: [],
        // 批量设置项目
        batchProjectIndex: -1,
    },
    onLoad(options) {
        const id = parseInt(options.id);
        this.setData({ batchId: id });
        this.loadDetail(id);
    },
    loadDetail(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.setData({ loading: true });
            try {
                const detail = yield (0, api_1.getAdminBatchDetail)(id);
                const driverRecord = detail.driverRecord || this.buildDefaultDriverRecord(detail);
                const [projectOptions, workTypeOptions] = yield Promise.all([
                    (0, api_1.getAdminProjects)().catch(() => []),
                    (0, api_1.getAdminWorkTypes)().catch(() => []),
                ]);
                this.setData({
                    batch: detail,
                    workers: detail.workerRecords || [],
                    driverRecord,
                    projectOptions: projectOptions || [],
                    workTypeOptions: workTypeOptions || [],
                });
            }
            catch (err) {
                console.error('加载详情失败', err);
                wx.showToast({ title: '加载详情失败', icon: 'none' });
            }
            finally {
                this.setData({ loading: false });
            }
        });
    },
    buildDefaultDriverRecord(detail) {
        return {
            id: null,
            driverId: detail.driverId,
            driverName: detail.driverName || '司机',
            attendanceType: 2,
            attendanceTypeText: '全天',
            overtimeHours: 0,
            dailyWage: 0,
            overtimeWage: 0,
            totalWage: 0,
            remark: detail.remark || '',
        };
    },
    onDriverOvertimeChange(e) {
        const record = Object.assign(Object.assign({}, this.data.driverRecord), { overtimeHours: parseFloat(e.detail.value) || 0 });
        const rate = record.overtimeHourlyRate || 0;
        const dailyWage = record.dailyWage || 0;
        const overtimeWage = Math.round(rate * record.overtimeHours * 100) / 100;
        const totalWage = Math.round((dailyWage + overtimeWage) * 100) / 100;
        this.setData({
            driverRecord: Object.assign(Object.assign({}, record), { dailyWage, overtimeWage, totalWage }),
        });
    },
    onDriverDailyWageChange(e) {
        const dailyWage = parseFloat(e.detail.value) || 0;
        const overtimeWage = this.data.driverRecord.overtimeWage || 0;
        const totalWage = Math.round((dailyWage + overtimeWage) * 100) / 100;
        this.setData({
            driverRecord: Object.assign(Object.assign({}, this.data.driverRecord), { dailyWage, totalWage }),
        });
    },
    onDriverRemarkChange(e) {
        this.setData({
            driverRecord: Object.assign(Object.assign({}, this.data.driverRecord), { remark: e.detail.value }),
        });
    },
    // 打开工人编辑弹窗
    openWorkerEdit(e) {
        var _a;
        if (((_a = this.data.batch) === null || _a === void 0 ? void 0 : _a.status) !== 0)
            return;
        const index = e.currentTarget.dataset.index;
        const worker = this.data.workers[index];
        let projectIndex = this.data.projectOptions.findIndex((p) => p.id === worker.projectId);
        // 如果工人没有分配项目，默认选中系统默认项目
        if (projectIndex < 0) {
            projectIndex = this.data.projectOptions.findIndex((p) => p.isSystem === 1 || p.projectName === '默认');
        }
        const workTypeIndex = this.data.workTypeOptions.findIndex((wt) => wt.id === worker.workTypeId);
        this.setData({
            editPanelOpen: true,
            editingWorkerIndex: index,
            editingWorker: Object.assign(Object.assign({}, worker), { projectIndex: projectIndex >= 0 ? projectIndex : 0, workTypeIndex: workTypeIndex >= 0 ? workTypeIndex : 0 }),
        });
    },
    // 阻止事件冒泡（无需额外逻辑）
    preventClose() {
        // do nothing
    },
    // 关闭编辑弹窗
    closeWorkerEdit() {
        this.setData({
            editPanelOpen: false,
            editingWorkerIndex: -1,
            editingWorker: null,
        });
    },
    // 出勤类型选择变化
    onWorkerAttendanceTypeChange(e) {
        const idx = e.detail.value;
        const attendanceType = idx === '1' ? 1 : 2;
        const next = Object.assign(Object.assign({}, this.data.editingWorker), { attendanceType });
        this.setData({
            editingWorker: this.recalcWorkerWages(next),
        });
    },
    // 加班时长变化
    onWorkerOvertimeChange(e) {
        const next = Object.assign(Object.assign({}, this.data.editingWorker), { overtimeHours: parseFloat(e.detail.value) || 0 });
        this.setData({
            editingWorker: this.recalcWorkerWages(next),
        });
    },
    // 日薪变化
    onWorkerDailyWageChange(e) {
        const dailyWage = parseFloat(e.detail.value) || 0;
        const next = Object.assign(Object.assign({}, this.data.editingWorker), { dailyWage });
        const overtimeWage = next.overtimeWage || 0;
        next.totalWage = Math.round((dailyWage + overtimeWage) * 100) / 100;
        this.setData({ editingWorker: next });
    },
    // 备注变化
    onWorkerRemarkChange(e) {
        this.setData({
            editingWorker: Object.assign(Object.assign({}, this.data.editingWorker), { remark: e.detail.value }),
        });
    },
    // 工地项目选择变化（单工人编辑）
    onWorkerProjectChange(e) {
        const idx = parseInt(e.detail.value);
        const project = this.data.projectOptions[idx];
        if (project) {
            this.setData({
                editingWorker: Object.assign(Object.assign({}, this.data.editingWorker), { projectId: project.id, projectName: project.projectName, projectIndex: idx }),
            });
        }
    },
    // 批量设置项目选择变化
    onBatchProjectChange(e) {
        this.setData({ batchProjectIndex: parseInt(e.detail.value) });
    },
    // 应用批量项目设置
    applyBatchProject() {
        const idx = this.data.batchProjectIndex;
        if (idx < 0 || idx >= this.data.projectOptions.length) {
            wx.showToast({ title: '请先选择项目', icon: 'none' });
            return;
        }
        const project = this.data.projectOptions[idx];
        const workers = this.data.workers.map((w) => (Object.assign(Object.assign({}, w), { projectId: project.id, projectName: project.projectName })));
        this.setData({ workers, batchProjectIndex: -1 });
        wx.showToast({ title: `已批量设置为${project.projectName}`, icon: 'success' });
    },
    // 作业类型选择变化
    onWorkerWorkTypeChange(e) {
        const idx = parseInt(e.detail.value);
        const wt = this.data.workTypeOptions[idx];
        if (wt) {
            this.setData({
                editingWorker: Object.assign(Object.assign({}, this.data.editingWorker), { workTypeId: wt.id, workTypeName: wt.typeName, workTypeIndex: idx }),
            });
        }
    },
    // 重算工人工资
    recalcWorkerWages(worker) {
        const base = worker.baseDailySalary || 0;
        const rate = worker.overtimeHourlyRate || 0;
        const attendanceType = worker.attendanceType;
        const overtimeHours = worker.overtimeHours || 0;
        const dailyWage = attendanceType === 1 ? Math.round((base / 2) * 100) / 100 : base;
        const overtimeWage = Math.round(rate * overtimeHours * 100) / 100;
        const totalWage = Math.round((dailyWage + overtimeWage) * 100) / 100;
        return Object.assign(Object.assign({}, worker), { dailyWage, overtimeWage, totalWage });
    },
    // 保存工人编辑
    saveWorkerEdit() {
        const index = this.data.editingWorkerIndex;
        if (index < 0 || !this.data.editingWorker)
            return;
        const workers = [...this.data.workers];
        workers[index] = this.data.editingWorker;
        this.setData({
            workers,
            editPanelOpen: false,
            editingWorkerIndex: -1,
            editingWorker: null,
        });
        wx.showToast({ title: '已更新', icon: 'success' });
    },
    onApprove() {
        return __awaiter(this, void 0, void 0, function* () {
            const id = this.data.batchId;
            if (!id)
                return;
            wx.showModal({
                title: '确认审核通过',
                content: '确定通过此考勤批次？',
                confirmColor: '#16a34a',
                success: (res) => __awaiter(this, void 0, void 0, function* () {
                    if (res.confirm) {
                        this.setData({ submitting: true });
                        try {
                            const driverRecord = this.data.driverRecord;
                            const payload = {
                                batchId: id,
                                workerRecords: this.data.workers.map((w) => ({
                                    recordId: w.id,
                                    workTypeId: w.workTypeId,
                                    projectId: w.projectId,
                                    attendanceType: w.attendanceType,
                                    overtimeHours: w.overtimeHours,
                                    dailyWage: w.dailyWage,
                                    overtimeWage: w.overtimeWage,
                                    totalWage: w.totalWage,
                                    remark: w.remark,
                                })),
                            };
                            if (driverRecord === null || driverRecord === void 0 ? void 0 : driverRecord.id) {
                                payload.driverRecord = {
                                    recordId: driverRecord.id,
                                    overtimeHours: driverRecord.overtimeHours,
                                    dailyWage: driverRecord.dailyWage,
                                    remark: driverRecord.remark,
                                };
                            }
                            yield (0, api_1.reviewBatch)(id, payload);
                            wx.showToast({ title: '审核通过', icon: 'success' });
                            setTimeout(() => wx.navigateBack(), 1000);
                        }
                        catch (err) {
                            wx.showToast({ title: err.message || '审核失败', icon: 'none' });
                        }
                        finally {
                            this.setData({ submitting: false });
                        }
                    }
                }),
            });
        });
    },
    onReject() {
        return __awaiter(this, void 0, void 0, function* () {
            const id = this.data.batchId;
            if (!id)
                return;
            wx.showModal({
                title: '确认不予通过',
                content: '确定不通过此考勤批次？',
                confirmColor: '#ef4444',
                success: (res) => __awaiter(this, void 0, void 0, function* () {
                    if (res.confirm) {
                        this.setData({ submitting: true });
                        try {
                            yield (0, api_1.rejectBatch)(id);
                            wx.showToast({ title: '已拒绝', icon: 'success' });
                            setTimeout(() => wx.navigateBack(), 1000);
                        }
                        catch (err) {
                            wx.showToast({ title: err.message || '操作失败', icon: 'none' });
                        }
                        finally {
                            this.setData({ submitting: false });
                        }
                    }
                }),
            });
        });
    },
    getStatusText(status) {
        return constants_1.BATCH_STATUS_TEXT[Number(status)] || '未知';
    },
});
