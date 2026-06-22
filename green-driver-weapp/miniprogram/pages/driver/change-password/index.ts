import { driverChangePassword, getCurrentUser } from '../../../utils/api'
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

      // 保存新 Token，更新 passwordChanged 状态
      if (newToken) {
        const currentUserInfo = wx.getStorageSync('userInfo') || {}
        currentUserInfo.passwordChanged = true
        saveLoginState(newToken, 'driver', currentUserInfo)

        // 立即刷新用户信息，确保 token 可用
        try {
          const freshUser: any = await getCurrentUser()
          if (freshUser) {
            freshUser.passwordChanged = true
            saveLoginState(newToken, 'driver', freshUser)
          }
        } catch {
          // ignore
        }
      }

      wx.showToast({ title: '修改成功', icon: 'success' })

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
