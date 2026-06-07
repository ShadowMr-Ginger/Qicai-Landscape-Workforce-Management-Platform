import { getCurrentUser, logout } from '../../../utils/api'
import { clearLoginState, getUserInfo } from '../../../utils/auth'

Page({
  data: {
    userInfo: null as any,
    displayName: '司机',
    avatarLetter: '司',
  },

  onLoad() {
    const userInfo = getUserInfo()
    if (userInfo) {
      this.setData({
        userInfo,
        displayName: userInfo.name || '司机',
        avatarLetter: (userInfo.name || '司')[0],
      })
    }
  },

  onShow() {
    this.loadUserInfo()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
  },

  async loadUserInfo() {
    try {
      const res: any = await getCurrentUser()
      this.setData({
        userInfo: res,
        displayName: res?.name || '司机',
        avatarLetter: (res?.name || '司')[0],
      })
    } catch (err) {
      console.error('获取用户信息失败', err)
    }
  },

  /** 修改密码 */
  goChangePassword() {
    wx.navigateTo({ url: '/pages/driver/change-password/index' })
  },

  /** 绑定/换绑微信 */
  goBindWechat() {
    wx.navigateTo({ url: '/pages/driver/wechat-bind/index' })
  },

  /** 退出登录 */
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '退出后需要重新登录',
      confirmColor: '#ef4444',
      success: async (res) => {
        if (res.confirm) {
          try {
            await logout()
          } catch (err) {
            // ignore
          }
          clearLoginState()
          wx.reLaunch({ url: '/pages/index/index' })
        }
      },
    })
  },
})
