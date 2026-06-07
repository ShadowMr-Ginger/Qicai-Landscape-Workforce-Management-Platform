import { bindAdminWechat } from '../../../utils/api'
import { setWxBound } from '../../../utils/auth'

Page({
  data: {
    binding: false,
  },

  async bindWechat() {
    this.setData({ binding: true })
    try {
      const wxRes: any = await new Promise((resolve, reject) => {
        wx.login({ success: resolve, fail: reject })
      })
      if (!wxRes.code) {
        wx.showToast({ title: '获取微信code失败', icon: 'none' })
        return
      }
      await bindAdminWechat(wxRes.code)
      setWxBound(true)
      wx.showToast({ title: '绑定成功', icon: 'success' })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/admin/home/index' })
      }, 1000)
    } catch (err: any) {
      wx.showToast({ title: err.message || '绑定失败', icon: 'none' })
    } finally {
      this.setData({ binding: false })
    }
  },

  skipBind() {
    wx.switchTab({ url: '/pages/admin/home/index' })
  },
})
