import { driverChangePassword } from '../../../utils/api'
import { saveLoginState } from '../../../utils/auth'

Page({
  data: {
    firstLogin: false,
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    loading: false,
  },

  onLoad(options: any) {
    this.setData({ firstLogin: options.firstLogin === 'true' })
  },

  onOldPasswordInput(e: any) {
    this.setData({ oldPassword: e.detail.value })
  },

  onNewPasswordInput(e: any) {
    this.setData({ newPassword: e.detail.value })
  },

  onConfirmPasswordInput(e: any) {
    this.setData({ confirmPassword: e.detail.value })
  },

  async onSubmit() {
    const { firstLogin, oldPassword, newPassword, confirmPassword } = this.data

    if (!firstLogin && !oldPassword) {
      wx.showToast({ title: '请输入原密码', icon: 'none' })
      return
    }
    if (!newPassword || newPassword.length < 6) {
      wx.showToast({ title: '新密码至少6位', icon: 'none' })
      return
    }
    if (newPassword !== confirmPassword) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' })
      return
    }

    this.setData({ loading: true })
    try {
      const newToken = await driverChangePassword(firstLogin ? '123456' : oldPassword, newPassword)
      wx.showToast({ title: '修改成功', icon: 'success' })

      // 保存新 Token，更新 passwordChanged 状态
      if (newToken) {
        wx.setStorageSync('token', newToken)
        const userInfo = wx.getStorageSync('userInfo') || {}
        userInfo.passwordChanged = true
        wx.setStorageSync('userInfo', userInfo)
      }

      if (firstLogin) {
        // 跳转到微信绑定
        setTimeout(() => {
          wx.redirectTo({ url: '/pages/driver/wechat-bind/index' })
        }, 1500)
      } else {
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    } catch (err) {
      console.error('修改密码失败', err)
    } finally {
      this.setData({ loading: false })
    }
  },
})
