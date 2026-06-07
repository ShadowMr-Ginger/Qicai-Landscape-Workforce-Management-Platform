import { STORAGE_KEYS } from './constants'

/**
 * 保存登录态
 */
export function saveLoginState(token: string, userType: string, userInfo: any) {
  wx.setStorageSync(STORAGE_KEYS.TOKEN, token)
  wx.setStorageSync(STORAGE_KEYS.USER_TYPE, userType)
  wx.setStorageSync(STORAGE_KEYS.USER_INFO, userInfo)
  const app = getApp()
  if (app) {
    app.globalData.token = token
    app.globalData.userType = userType
    app.globalData.userInfo = userInfo
  }
}

/**
 * 清除登录态
 */
export function clearLoginState() {
  wx.removeStorageSync(STORAGE_KEYS.TOKEN)
  wx.removeStorageSync(STORAGE_KEYS.USER_TYPE)
  wx.removeStorageSync(STORAGE_KEYS.USER_INFO)
  wx.removeStorageSync(STORAGE_KEYS.WX_BOUND)
  const app = getApp()
  if (app) {
    app.globalData.token = ''
    app.globalData.userType = ''
    app.globalData.userInfo = null
  }
}

/**
 * 检查是否已登录
 */
export function checkLogin(): boolean {
  const token = wx.getStorageSync(STORAGE_KEYS.TOKEN)
  return !!token
}

/**
 * 获取当前用户类型
 */
export function getUserType(): string {
  return wx.getStorageSync(STORAGE_KEYS.USER_TYPE) || ''
}

/**
 * 获取当前用户信息
 */
export function getUserInfo(): any {
  return wx.getStorageSync(STORAGE_KEYS.USER_INFO) || null
}

/**
 * 判断司机是否已绑定微信
 */
export function isWxBound(): boolean {
  return wx.getStorageSync(STORAGE_KEYS.WX_BOUND) === true
}

/**
 * 设置微信绑定状态
 */
export function setWxBound(bound: boolean) {
  wx.setStorageSync(STORAGE_KEYS.WX_BOUND, bound)
}
