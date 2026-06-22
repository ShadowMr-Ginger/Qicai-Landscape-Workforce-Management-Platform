import { adminLogin, adminWxLogin } from '../../../utils/api'
import { saveLoginState, setWxBound } from '../../../utils/auth'

Page({
  data: {
    username: '',
    password: '',
    loading: false,
    wxLoading: false,
  },

  onUsernameInput(e: any) {
    this.setData({ username: e.detail.value })
  },

  onPasswordInput(e: any) {
    this.setData({ password: e.detail.value })
  },

  async onLogin() {
    const { username, password } = this.data
    if (!username.trim()) {
      wx.showToast({ title: '请输入账号', icon: 'none' })
      return
    }
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' })
      return
    }
    this.setData({ loading: true })
    try {
      const res: any = await adminLogin(username.trim(), password)
      this.handleLoginSuccess(res)
    } catch (err) {
      console.error('登录失败', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  async onWxLogin() {
    this.setData({ wxLoading: true })
    try {
      const wxRes: any = await new Promise((resolve, reject) => {
        wx.login({ success: resolve, fail: reject })
      })
      if (!wxRes.code) {
        wx.showToast({ title: '微信登录失败', icon: 'none' })
        return
      }
      const res: any = await adminWxLogin(wxRes.code)
      setWxBound(true)
      this.handleLoginSuccess(res)
    } catch (err: any) {
      wx.showToast({ title: err.message || '微信登录失败', icon: 'none' })
    } finally {
      this.setData({ wxLoading: false })
    }
  },

  handleLoginSuccess(res: any) {
    const { token, userInfo } = res
    saveLoginState(token, 'admin', userInfo)
    setWxBound(!!userInfo?.wxBound)
    if (!userInfo?.wxBound) {
      wx.redirectTo({ url: '/pages/admin/wechat-bind/index' })
    } else {
      wx.switchTab({ url: '/pages/admin/home/index' })
    }
  },

  goBack() {
    wx.navigateBack()
  },
})
