import { bindWechat } from '../../../utils/api'
import { setWxBound } from '../../../utils/auth'

Page({
  data: {
    loading: false,
  },

  onLoad() {},

  async onBindWx() {
    this.setData({ loading: true })
    try {
      const wxRes: any = await new Promise((resolve, reject) => {
        wx.login({ success: resolve, fail: reject })
      })

      if (!wxRes.code) {
        wx.showToast({ title: '微信授权失败', icon: 'none' })
        return
      }

      await bindWechat(wxRes.code)
      setWxBound(true)
      wx.showToast({ title: '绑定成功', icon: 'success' })

      setTimeout(() => {
        wx.switchTab({ url: '/pages/driver/home/index' })
      }, 1500)
    } catch (err: any) {
      const msg = err.message || '绑定失败'
      wx.showToast({ title: msg, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onSkip() {
    wx.switchTab({ url: '/pages/driver/home/index' })
  },
})
