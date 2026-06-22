import { bindAdminWechat, getCurrentUser } from '../../../utils/api'
import { setWxBound } from '../../../utils/auth'

Page({
  data: {
    binding: false,
    boundOpenid: '',
  },

  async onLoad() {
    try {
      const user: any = await getCurrentUser()
      if (user?.wxOpenid) {
        this.setData({ boundOpenid: user.wxOpenid })
      }
    } catch {
      // ignore
    }
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
      await this.doBind(wxRes.code)
    } catch (err: any) {
      wx.showToast({ title: err.message || '绑定失败', icon: 'none' })
    } finally {
      this.setData({ binding: false })
    }
  },

  async doBind(wxCode: string, confirm?: boolean) {
    const result: any = await bindAdminWechat(wxCode, confirm)
    if (result?.status === 'BOUND_SELF') {
      wx.showToast({ title: '该账号已与当前微信号绑定', icon: 'none' })
      setWxBound(true)
      setTimeout(() => {
        wx.switchTab({ url: '/pages/admin/home/index' })
      }, 1500)
      return
    }

    if (result?.status === 'BOUND_OTHER') {
      const boundOpenid = result.boundOpenid || '其他微信'
      wx.showModal({
        title: '确认重新绑定',
        content: `该账号已绑定微信（${boundOpenid}），继续绑定当前账号将解除之前绑定的账号，是否继续？`,
        confirmText: '继续绑定',
        cancelText: '取消',
        success: async (res) => {
          if (res.confirm) {
            try {
              this.setData({ binding: true })
              await this.doBind(wxCode, true)
            } catch (err: any) {
              wx.showToast({ title: err.message || '绑定失败', icon: 'none' })
            } finally {
              this.setData({ binding: false })
            }
          }
        },
      })
      return
    }

    // BOUND_SUCCESS
    setWxBound(true)
    wx.showToast({ title: '绑定成功', icon: 'success' })
    setTimeout(() => {
      wx.switchTab({ url: '/pages/admin/home/index' })
    }, 1000)
  },

  skipBind() {
    wx.switchTab({ url: '/pages/admin/home/index' })
  },
})
