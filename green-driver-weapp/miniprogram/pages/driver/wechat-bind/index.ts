import { bindWechat, getCurrentUser } from '../../../utils/api'
import { setWxBound, getUserType, clearLoginState } from '../../../utils/auth'

Page({
  data: {
    loading: false,
    boundOpenid: '',
  },

  async onLoad() {
    const userType = getUserType()
    if (userType !== 'driver') {
      clearLoginState()
      wx.reLaunch({ url: '/pages/driver/login/index' })
      return
    }
    try {
      const user: any = await getCurrentUser()
      if (user?.wxOpenid) {
        this.setData({ boundOpenid: user.wxOpenid })
      }
    } catch {
      // ignore
    }
  },

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

      await this.doBind(wxRes.code)
    } catch (err: any) {
      const msg = err.message || '绑定失败'
      wx.showToast({ title: msg, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  async doBind(wxCode: string, confirm?: boolean) {
    const result: any = await bindWechat(wxCode, confirm)
    if (result?.status === 'BOUND_SELF') {
      wx.showToast({ title: '该账号已与当前微信号绑定', icon: 'none' })
      setWxBound(true)
      setTimeout(() => {
        wx.switchTab({ url: '/pages/driver/home/index' })
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
              this.setData({ loading: true })
              await this.doBind(wxCode, true)
            } catch (err: any) {
              wx.showToast({ title: err.message || '绑定失败', icon: 'none' })
            } finally {
              this.setData({ loading: false })
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
      wx.switchTab({ url: '/pages/driver/home/index' })
    }, 1500)
  },

  onSkip() {
    wx.switchTab({ url: '/pages/driver/home/index' })
  },
})
