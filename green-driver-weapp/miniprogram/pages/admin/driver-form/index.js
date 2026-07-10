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
function getDefaults() {
    let defaults = { maleBase: 120, femaleBase: 90, overtimeRate: 15 };
    try {
        const raw = wx.getStorageSync('driverDefaultSalary');
        if (raw)
            defaults = Object.assign(Object.assign({}, defaults), JSON.parse(raw));
    }
    catch (_a) {
        // ignore
    }
    return defaults;
}
function computeSalary(gender) {
    const defaults = getDefaults();
    return {
        baseDailySalary: String(gender === '1' ? defaults.maleBase : defaults.femaleBase),
        overtimeHourlyRate: String(defaults.overtimeRate),
    };
}
Page({
    data: {
        mode: 'create',
        id: null,
        form: {
            name: '',
            gender: '1',
            phone: '',
            idCard: '',
            baseDailySalary: '',
            overtimeHourlyRate: '',
            emergencyContactPhone: '',
        },
    },
    onLoad(options) {
        const mode = options.mode || 'create';
        this.setData({ mode });
        if (mode === 'edit' && options.id) {
            const id = Number(options.id);
            this.setData({ id });
            this.loadDetail(id);
        }
        else {
            const { baseDailySalary, overtimeHourlyRate } = computeSalary(this.data.form.gender);
            this.setData({ form: Object.assign(Object.assign({}, this.data.form), { baseDailySalary, overtimeHourlyRate }) });
            wx.setNavigationBarTitle({ title: '新增司机' });
        }
    },
    loadDetail(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const res = yield (0, api_1.getDriverDetail)(id);
                const d = (res === null || res === void 0 ? void 0 : res.data) || res;
                if (d) {
                    // 后端司机性别：1-男，0-女
                    const gender = d.genderText === '女' ? '0' : '1';
                    this.setData({
                        form: {
                            name: d.realName || '',
                            gender,
                            phone: d.phone || '',
                            idCard: d.idCard || '',
                            baseDailySalary: String(d.baseDailySalary || ''),
                            overtimeHourlyRate: String(d.overtimeHourlyRate || ''),
                            emergencyContactPhone: d.emergencyContactPhone || '',
                        },
                    });
                    wx.setNavigationBarTitle({ title: '编辑司机' });
                }
            }
            catch (err) {
                console.error('加载司机详情失败', err);
                wx.showToast({ title: '加载详情失败', icon: 'none' });
            }
        });
    },
    onFieldChange(e) {
        const field = e.currentTarget.dataset.field;
        const value = e.detail.value;
        this.setData({ form: Object.assign(Object.assign({}, this.data.form), { [field]: value }) });
    },
    onGenderChange(e) {
        // picker index 0=男 1=女
        const value = e.detail.value === '1' ? '0' : '1';
        const { baseDailySalary, overtimeHourlyRate } = computeSalary(value);
        this.setData({ form: Object.assign(Object.assign({}, this.data.form), { gender: value, baseDailySalary, overtimeHourlyRate }) });
    },
    handleSave() {
        return __awaiter(this, void 0, void 0, function* () {
            const { form, mode, id } = this.data;
            if (!form.name.trim()) {
                wx.showToast({ title: '请输入姓名', icon: 'none' });
                return;
            }
            const payload = {
                realName: form.name.trim(),
                gender: Number(form.gender),
                phone: form.phone || undefined,
                idCard: form.idCard || undefined,
                baseDailySalary: Number(form.baseDailySalary) || 0,
                overtimeHourlyRate: Number(form.overtimeHourlyRate) || 0,
                emergencyContactPhone: form.emergencyContactPhone || undefined,
            };
            try {
                if (mode === 'edit' && id) {
                    yield (0, api_1.updateDriver)(id, payload);
                    wx.showToast({ title: '修改成功', icon: 'success' });
                }
                else {
                    yield (0, api_1.createDriver)(payload);
                    wx.showToast({ title: '新增成功', icon: 'success' });
                }
                setTimeout(() => wx.navigateBack(), 800);
            }
            catch (err) {
                wx.showToast({ title: err.message || '保存失败', icon: 'none' });
            }
        });
    },
    handleCancel() {
        wx.navigateBack();
    },
});
