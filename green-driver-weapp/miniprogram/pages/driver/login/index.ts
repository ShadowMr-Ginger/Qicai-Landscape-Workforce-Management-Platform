import { driverLogin, driverWxLogin } from '../../../utils/api'
import { saveLoginState, setWxBound } from '../../../utils/auth'

Page({
  data: {
    name: '',
    password: '',
    loading: false,
    wxLoading: false,
  },

  onNameInput(e: any) {
    this.setData({ name: e.detail.value })
  },

  onPasswordInput(e: any) {
    this.setData({ password: e.detail.value })
  },

  /** 账号密码登录 */
  async onLogin() {
    const { name, password } = this.data
    if (!name.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' })
      return
    }

    this.setData({ loading: true })
    try {
      const res: any = await driverLogin(name.trim(), password)
      this.handleLoginSuccess(res)
    } catch (err) {
      console.error('登录失败', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  /** 微信登录 */
  async onWxLogin() {
    this.setData({ wxLoading: true })
    try {
      const wxRes: any = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject,
        })
      })

      if (!wxRes.code) {
        wx.showToast({ title: '微信登录失败', icon: 'none' })
        return
      }

      const res: any = await driverWxLogin(wxRes.code)
      setWxBound(true)
      this.handleLoginSuccess(res)
    } catch (err: any) {
      const msg = err.message || '微信登录失败'
      wx.showToast({ title: msg, icon: 'none' })
    } finally {
      this.setData({ wxLoading: false })
    }
  },

  /** 登录成功处理 */
  handleLoginSuccess(res: any) {
    const { token, userInfo, firstLogin } = res
    saveLoginState(token, 'driver', userInfo)
    setWxBound(!!userInfo?.wxBound)

    if (firstLogin) {
      // 首次登录，强制修改密码
      wx.redirectTo({ url: '/pages/driver/change-password/index?firstLogin=true' })
    } else if (!userInfo?.wxBound) {
      // 未绑定微信，跳转绑定页
      wx.redirectTo({ url: '/pages/driver/wechat-bind/index' })
    } else {
      wx.switchTab({ url: '/pages/driver/home/index' })
    }
  },

  /** 返回首页 */
  goBack() {
    wx.navigateBack()
  },
})
