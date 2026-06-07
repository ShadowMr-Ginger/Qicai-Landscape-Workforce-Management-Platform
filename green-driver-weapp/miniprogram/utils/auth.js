"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveLoginState = saveLoginState;
exports.clearLoginState = clearLoginState;
exports.checkLogin = checkLogin;
exports.getUserType = getUserType;
exports.getUserInfo = getUserInfo;
exports.isWxBound = isWxBound;
exports.setWxBound = setWxBound;
const constants_1 = require("./constants");
/**
 * 保存登录态
 */
function saveLoginState(token, userType, userInfo) {
    wx.setStorageSync(constants_1.STORAGE_KEYS.TOKEN, token);
    wx.setStorageSync(constants_1.STORAGE_KEYS.USER_TYPE, userType);
    wx.setStorageSync(constants_1.STORAGE_KEYS.USER_INFO, userInfo);
    const app = getApp();
    if (app) {
        app.globalData.token = token;
        app.globalData.userType = userType;
        app.globalData.userInfo = userInfo;
    }
}
/**
 * 清除登录态
 */
function clearLoginState() {
    wx.removeStorageSync(constants_1.STORAGE_KEYS.TOKEN);
    wx.removeStorageSync(constants_1.STORAGE_KEYS.USER_TYPE);
    wx.removeStorageSync(constants_1.STORAGE_KEYS.USER_INFO);
    wx.removeStorageSync(constants_1.STORAGE_KEYS.WX_BOUND);
    const app = getApp();
    if (app) {
        app.globalData.token = '';
        app.globalData.userType = '';
        app.globalData.userInfo = null;
    }
}
/**
 * 检查是否已登录
 */
function checkLogin() {
    const token = wx.getStorageSync(constants_1.STORAGE_KEYS.TOKEN);
    return !!token;
}
/**
 * 获取当前用户类型
 */
function getUserType() {
    return wx.getStorageSync(constants_1.STORAGE_KEYS.USER_TYPE) || '';
}
/**
 * 获取当前用户信息
 */
function getUserInfo() {
    return wx.getStorageSync(constants_1.STORAGE_KEYS.USER_INFO) || null;
}
/**
 * 判断司机是否已绑定微信
 */
function isWxBound() {
    return wx.getStorageSync(constants_1.STORAGE_KEYS.WX_BOUND) === true;
}
/**
 * 设置微信绑定状态
 */
function setWxBound(bound) {
    wx.setStorageSync(constants_1.STORAGE_KEYS.WX_BOUND, bound);
}
