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
        keyword: '',
        gender: '',
        showResigned: false,
        managing: false,
        total: 0,
    },
    onLoad() {
        this.loadDrivers();
    },
    onShow() {
        this.loadDrivers();
    },
    onPullDownRefresh() {
        this.loadDrivers().finally(() => wx.stopPullDownRefresh());
    },
    loadDrivers() {
        return __awaiter(this, void 0, void 0, function* () {
            this.setData({ loading: true });
            try {
                const params = {
                    isActive: this.data.showResigned ? 0 : 1,
                    pageNum: 1,
                    pageSize: 100,
                };
                if (this.data.keyword)
                    params.keyword = this.data.keyword;
                if (this.data.gender !== '')
                    params.gender = Number(this.data.gender);
                const res = yield (0, api_1.getAdminDrivers)(params);
                const list = (res === null || res === void 0 ? void 0 : res.records) || res || [];
                this.setData({ drivers: list, total: (res === null || res === void 0 ? void 0 : res.total) || list.length });
            }
            catch (err) {
                console.error('加载司机列表失败', err);
                wx.showToast({ title: '加载失败', icon: 'none' });
            }
            finally {
                this.setData({ loading: false });
            }
        });
    },
    onKeywordInput(e) {
        this.setData({ keyword: e.detail.value });
    },
    onGenderChange(e) {
        // picker index 0=全部 1=男 2=女；后端 1=男 0=女
        const index = Number(e.detail.value);
        const value = index === 0 ? '' : (index === 1 ? '1' : '0');
        this.setData({ gender: value });
        this.loadDrivers();
    },
    doSearch() {
        this.loadDrivers();
    },
    resetFilter() {
        this.setData({ keyword: '', gender: '' });
        this.loadDrivers();
    },
    toggleShowResigned() {
        this.setData({ showResigned: !this.data.showResigned, managing: false });
        this.loadDrivers();
    },
    toggleManaging() {
        this.setData({ managing: !this.data.managing });
    },
    goCreate() {
        wx.navigateTo({ url: '/pages/admin/driver-form/index?mode=create' });
    },
    goEdit(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({ url: `/pages/admin/driver-form/index?mode=edit&id=${id}` });
    },
    handleResign(e) {
        const id = e.currentTarget.dataset.id;
        const name = e.currentTarget.dataset.name;
        wx.showModal({
            title: '确认离职',
            content: `确定要将司机 ${name} 设置为离职状态吗？`,
            confirmColor: '#ea580c',
            success: (res) => __awaiter(this, void 0, void 0, function* () {
                if (res.confirm) {
                    try {
                        yield (0, api_1.resignDriver)(id);
                        wx.showToast({ title: '已设置为离职', icon: 'success' });
                        this.loadDrivers();
                    }
                    catch (err) {
                        console.error('离职失败', err);
                    }
                }
            }),
        });
    },
    handleRestore(e) {
        const id = e.currentTarget.dataset.id;
        const name = e.currentTarget.dataset.name;
        wx.showModal({
            title: '确认恢复在职',
            content: `确定要将司机 ${name} 恢复为在职状态吗？`,
            confirmColor: '#16a34a',
            success: (res) => __awaiter(this, void 0, void 0, function* () {
                if (res.confirm) {
                    try {
                        yield (0, api_1.restoreDriver)(id);
                        wx.showToast({ title: '已恢复在职', icon: 'success' });
                        this.loadDrivers();
                    }
                    catch (err) {
                        console.error('恢复在职失败', err);
                    }
                }
            }),
        });
    },
    handleDelete(e) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = e.currentTarget.dataset.id;
            const name = e.currentTarget.dataset.name;
            let count = 0;
            try {
                const res = yield (0, api_1.getDriverAttendanceCount)(id);
                count = res || 0;
            }
            catch (_a) {
                count = 0;
            }
            wx.showModal({
                title: '危险操作：删除司机',
                content: `该司机关联有 ${count} 条考勤记录，删除将同时删除这些记录，操作不可撤销！`,
                confirmColor: '#dc2626',
                success: (res) => __awaiter(this, void 0, void 0, function* () {
                    if (res.confirm) {
                        try {
                            yield (0, api_1.deleteDriver)(id);
                            wx.showToast({ title: '删除成功', icon: 'success' });
                            this.loadDrivers();
                        }
                        catch (err) {
                            console.error('删除失败', err);
                        }
                    }
                }),
            });
        });
    },
    handleResetPwd(e) {
        const id = e.currentTarget.dataset.id;
        const name = e.currentTarget.dataset.name;
        wx.showModal({
            title: '确认重置密码',
            content: `确定要重置司机 ${name} 的密码为 123456 吗？`,
            confirmColor: '#9333ea',
            success: (res) => __awaiter(this, void 0, void 0, function* () {
                if (res.confirm) {
                    try {
                        yield (0, api_1.resetDriverPassword)(id);
                        wx.showToast({ title: '密码已重置', icon: 'success' });
                    }
                    catch (err) {
                        console.error('重置密码失败', err);
                    }
                }
            }),
        });
    },
});
