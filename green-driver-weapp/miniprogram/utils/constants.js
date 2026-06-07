"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ATTENDANCE_TYPE_TEXT = exports.ATTENDANCE_TYPE = exports.BATCH_STATUS_COLOR = exports.BATCH_STATUS_TEXT = exports.BATCH_STATUS = exports.STORAGE_KEYS = exports.API_BASE_URL = void 0;
// API 基础地址
exports.API_BASE_URL = 'http://192.168.175.129:8080/api';
// 本地存储键名
exports.STORAGE_KEYS = {
    TOKEN: 'token',
    USER_TYPE: 'userType',
    USER_INFO: 'userInfo',
    WX_BOUND: 'wxBound',
};
// 批次状态
exports.BATCH_STATUS = {
    PENDING: 0, // 待审核
    APPROVED: 1, // 已通过
    WITHDRAWN: 2, // 已撤回
    REJECTED: 3, // 不通过
};
exports.BATCH_STATUS_TEXT = {
    0: '待审核',
    1: '已通过',
    2: '已撤回',
    3: '不通过',
};
exports.BATCH_STATUS_COLOR = {
    0: 'badge-orange',
    1: 'badge-green',
    2: 'badge-blue',
    3: 'badge-red',
};
// 出勤类型
exports.ATTENDANCE_TYPE = {
    HALF: 1,
    FULL: 2,
};
exports.ATTENDANCE_TYPE_TEXT = {
    1: '半天',
    2: '全天',
};
