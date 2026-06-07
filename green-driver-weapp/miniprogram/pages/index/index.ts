import { checkLogin, getUserType } from '../../utils/auth'

Page({
  data: {
    loading: false,
  },

  onLoad() {
    // 如果已登录，直接跳转到对应首页
    if (checkLogin()) {
      const userType = getUserType()
      if (userType === 'driver') {
        wx.switchTab({ url: '/pages/driver/home/index' })
      } else if (userType === 'admin') {
        wx.switchTab({ url: '/pages/admin/home/index' })
      }
    }
  },

  /** 司机入口 */
  goDriverLogin() {
    wx.navigateTo({ url: '/pages/driver/login/index' })
  },

  /** 管理员入口 */
  goAdminLogin() {
    wx.navigateTo({ url: '/pages/admin/login/index' })
  },
})
