import { getCurrentUser } from '../../../utils/api'
import { getUserInfo, clearLoginState } from '../../../utils/auth'

Page({
  data: {
    userInfo: null as any,
    avatarText: '管',
    displayName: '管理员',
  },

  onShow() {
    this.loadUserInfo()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
  },

  async loadUserInfo() {
    const stored = getUserInfo()
    if (stored) {
      const name = stored.name || stored.realName || '管理员'
      this.setData({ userInfo: stored, avatarText: name.charAt(0), displayName: name })
    }
    try {
      const user = await getCurrentUser()
      if (user) {
        const name = user.name || user.realName || '管理员'
        this.setData({ userInfo: user, avatarText: name.charAt(0), displayName: name })
      }
    } catch (err) {
      console.error('获取用户信息失败', err)
    }
  },

  goBindWechat() {
    wx.navigateTo({ url: '/pages/admin/wechat-bind/index' })
  },

  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定退出登录？',
      success: (res) => {
        if (res.confirm) {
          clearLoginState()
          wx.reLaunch({ url: '/pages/index/index' })
        }
      },
    })
  },
})
