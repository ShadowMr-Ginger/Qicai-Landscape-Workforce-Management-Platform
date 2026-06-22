"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.request = request;
exports.driverLogin = driverLogin;
exports.driverWxLogin = driverWxLogin;
exports.getCurrentUser = getCurrentUser;
exports.logout = logout;
exports.driverChangePassword = driverChangePassword;
exports.bindWechat = bindWechat;
exports.getFavoriteWorkers = getFavoriteWorkers;
exports.searchAvailableWorkers = searchAvailableWorkers;
exports.addFavoriteWorker = addFavoriteWorker;
exports.removeFavoriteWorker = removeFavoriteWorker;
exports.getDriverBatches = getDriverBatches;
exports.getDriverBatchDetail = getDriverBatchDetail;
exports.createDriverBatch = createDriverBatch;
exports.updateDriverBatch = updateDriverBatch;
exports.withdrawBatch = withdrawBatch;
exports.deleteDriverBatch = deleteDriverBatch;
exports.getWorkTypeList = getWorkTypeList;
exports.adminLogin = adminLogin;
exports.adminWxLogin = adminWxLogin;
exports.bindAdminWechat = bindAdminWechat;
exports.adminChangePassword = adminChangePassword;
exports.getAdminDashboardStats = getAdminDashboardStats;
exports.getAdminBatches = getAdminBatches;
exports.getAdminBatchDetail = getAdminBatchDetail;
exports.reviewBatch = reviewBatch;
exports.rejectBatch = rejectBatch;
exports.approveBatchSimple = approveBatchSimple;
exports.getWorkerAttendanceRecords = getWorkerAttendanceRecords;
exports.getWorkerAttendanceDetail = getWorkerAttendanceDetail;
exports.getDriverAttendanceRecords = getDriverAttendanceRecords;
exports.getDriverAttendanceDetail = getDriverAttendanceDetail;
exports.getWorkerWageSummary = getWorkerWageSummary;
exports.getDriverWageSummary = getDriverWageSummary;
exports.getWorkerCalendar = getWorkerCalendar;
exports.getDriverCalendar = getDriverCalendar;
exports.getAdminWorkers = getAdminWorkers;
exports.getAdminDrivers = getAdminDrivers;
exports.getAdminProjects = getAdminProjects;
exports.getAdminWorkTypes = getAdminWorkTypes;
exports.getAdminGroups = getAdminGroups;
const constants_1 = require("./constants");
/**
 * 统一请求封装
 */
function request(url, options = {}) {
    const { method = 'GET', data, header = {}, noAuth = false } = options;
    return new Promise((resolve, reject) => {
        const reqHeader = Object.assign({ 'Content-Type': 'application/json' }, header);
        if (!noAuth) {
            const token = wx.getStorageSync(constants_1.STORAGE_KEYS.TOKEN);
            if (token) {
                reqHeader.Authorization = `Bearer ${String(token).trim()}`;
            }
        }
        wx.request({
            url: `${constants_1.API_BASE_URL}${url}`,
            method,
            data,
            header: reqHeader,
            timeout: 10000,
            success: (res) => {
                const result = res.data;
                if (result.code === 200) {
                    resolve(result.data);
                }
                else if (result.code === 401 || result.code === 403) {
                    // Token 过期或角色不匹配，清除登录态并跳转对应登录页
                    const userType = wx.getStorageSync(constants_1.STORAGE_KEYS.USER_TYPE);
                    wx.removeStorageSync(constants_1.STORAGE_KEYS.TOKEN);
                    wx.removeStorageSync(constants_1.STORAGE_KEYS.USER_TYPE);
                    wx.removeStorageSync(constants_1.STORAGE_KEYS.USER_INFO);
                    wx.removeStorageSync(constants_1.STORAGE_KEYS.WX_BOUND);
                    wx.showToast({ title: result.code === 401 ? '登录已过期' : '登录状态异常', icon: 'none' });
                    setTimeout(() => {
                        if (userType === 'driver') {
                            wx.reLaunch({ url: '/pages/driver/login/index' });
                        }
                        else if (userType === 'admin') {
                            wx.reLaunch({ url: '/pages/admin/login/index' });
                        }
                        else {
                            wx.reLaunch({ url: '/pages/index/index' });
                        }
                    }, 1500);
                    reject(new Error(result.message || '未登录'));
                }
                else {
                    wx.showToast({ title: result.message || '请求失败', icon: 'none' });
                    reject(new Error(result.message));
                }
            },
            fail: (err) => {
                let msg = '网络错误';
                if (err.errMsg && err.errMsg.includes('timeout')) {
                    msg = '请求超时，请检查网络或后端服务';
                }
                else if (err.errMsg && err.errMsg.includes('fail')) {
                    msg = '无法连接到服务器';
                }
                wx.showToast({ title: msg, icon: 'none' });
                reject(new Error(msg));
            },
        });
    });
}
// ==================== 认证相关 ====================
function driverLogin(name, password) {
    return request('/auth/driver/login', {
        method: 'POST',
        data: { name, password },
        noAuth: true,
    });
}
function driverWxLogin(wxCode) {
    return request('/auth/driver/wx-login', {
        method: 'POST',
        data: { wxCode },
        noAuth: true,
    });
}
function getCurrentUser() {
    return request('/auth/current-user', { method: 'GET' });
}
function logout() {
    return request('/auth/logout', { method: 'POST' });
}
function driverChangePassword(oldPassword, newPassword) {
    return request('/driver/change-password', {
        method: 'POST',
        data: { oldPassword, newPassword },
    });
}
function bindWechat(wxCode, confirm) {
    return request('/driver/bind-wx', {
        method: 'POST',
        data: { wxCode, confirm },
    });
}
// ==================== 常用工人 ====================
function getFavoriteWorkers() {
    return request('/driver/favorite-workers', { method: 'GET' });
}
function searchAvailableWorkers(keyword) {
    return request(`/driver/favorite-workers/search?keyword=${encodeURIComponent(keyword || '')}`, { method: 'GET' });
}
function addFavoriteWorker(workerId) {
    return request(`/driver/favorite-workers/${workerId}`, { method: 'POST' });
}
function removeFavoriteWorker(workerId) {
    return request(`/driver/favorite-workers/${workerId}`, { method: 'DELETE' });
}
// ==================== 考勤批次 ====================
function getDriverBatches(status) {
    let url = '/driver/batches';
    if (status !== undefined) {
        url += `?status=${status}`;
    }
    return request(url, { method: 'GET' });
}
function getDriverBatchDetail(id) {
    return request(`/driver/batches/${id}`, { method: 'GET' });
}
function createDriverBatch(data) {
    return request('/driver/batches', {
        method: 'POST',
        data,
    });
}
function updateDriverBatch(id, data) {
    return request(`/driver/batches/${id}`, {
        method: 'PUT',
        data,
    });
}
function withdrawBatch(id) {
    return request(`/driver/batches/${id}/withdraw`, { method: 'PUT' });
}
function deleteDriverBatch(id) {
    return request(`/driver/batches/${id}`, { method: 'DELETE' });
}
// ==================== 作业类型 ====================
function getWorkTypeList() {
    return request('/driver/work-types', { method: 'GET' });
}
// ==================== 管理员相关 ====================
function adminLogin(username, password) {
    return request('/auth/admin/login', {
        method: 'POST',
        data: { username, password },
        noAuth: true,
    });
}
function adminWxLogin(wxCode) {
    return request('/auth/admin/wx-login', {
        method: 'POST',
        data: { wxCode },
        noAuth: true,
    });
}
function bindAdminWechat(wxCode, confirm) {
    return request('/admin/bind-wx', {
        method: 'POST',
        data: { wxCode, confirm },
    });
}
function adminChangePassword(oldPassword, newPassword) {
    return request('/admin/change-password', {
        method: 'POST',
        data: { oldPassword, newPassword },
    });
}
// 管理员Dashboard统计
function getAdminDashboardStats() {
    return request('/admin/attendance/dashboard/stats', { method: 'GET' });
}
// 考勤批次审核
function getAdminBatches(params) {
    let url = '/admin/attendance/batches';
    if (params) {
        const qs = Object.entries(params)
            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
            .join('&');
        if (qs)
            url += `?${qs}`;
    }
    return request(url, { method: 'GET' });
}
function getAdminBatchDetail(id) {
    return request(`/admin/attendance/batches/${id}`, { method: 'GET' });
}
function reviewBatch(id, data) {
    return request(`/admin/attendance/batches/${id}/review`, {
        method: 'PUT',
        data,
    });
}
function rejectBatch(id) {
    return request(`/admin/attendance/batches/${id}/reject`, { method: 'PUT' });
}
function approveBatchSimple(id) {
    return request(`/admin/attendance/batches/${id}/approve`, { method: 'PUT' });
}
// 工人考勤记录
function getWorkerAttendanceRecords(params) {
    let url = '/admin/attendance/worker-records';
    if (params) {
        const qs = Object.entries(params)
            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
            .join('&');
        if (qs)
            url += `?${qs}`;
    }
    return request(url, { method: 'GET' });
}
function getWorkerAttendanceDetail(id) {
    return request(`/admin/attendance/worker-records/${id}`, { method: 'GET' });
}
// 司机考勤记录
function getDriverAttendanceRecords(params) {
    let url = '/admin/attendance/driver-records';
    if (params) {
        const qs = Object.entries(params)
            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
            .join('&');
        if (qs)
            url += `?${qs}`;
    }
    return request(url, { method: 'GET' });
}
function getDriverAttendanceDetail(id) {
    return request(`/admin/attendance/driver-records/${id}`, { method: 'GET' });
}
// 汇总统计
function getWorkerWageSummary(workerId) {
    return request(`/admin/attendance/workers/${workerId}/wage-summary`, { method: 'GET' });
}
function getDriverWageSummary(driverId) {
    return request(`/admin/attendance/drivers/${driverId}/wage-summary`, { method: 'GET' });
}
function getWorkerCalendar(workerId, year, month) {
    return request(`/admin/attendance/workers/${workerId}/calendar?year=${year}&month=${month}`, { method: 'GET' });
}
function getDriverCalendar(driverId, year, month) {
    return request(`/admin/attendance/drivers/${driverId}/calendar?year=${year}&month=${month}`, { method: 'GET' });
}
// 基础数据
function getAdminWorkers(params) {
    let url = '/admin/workers';
    if (params) {
        const qs = Object.entries(params)
            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
            .join('&');
        if (qs)
            url += `?${qs}`;
    }
    return request(url, { method: 'GET' });
}
function getAdminDrivers() {
    return request('/admin/drivers', { method: 'GET' });
}
function getAdminProjects() {
    return request('/admin/projects/all', { method: 'GET' });
}
function getAdminWorkTypes() {
    return request('/admin/work-types', { method: 'GET' });
}
function getAdminGroups() {
    return request('/admin/groups', { method: 'GET' });
}
