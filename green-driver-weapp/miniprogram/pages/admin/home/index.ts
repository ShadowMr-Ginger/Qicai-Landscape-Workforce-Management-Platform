import { getAdminDashboardStats, getCurrentUser } from '../../../utils/api'
import { getUserInfo } from '../../../utils/auth'
import { BATCH_STATUS_TEXT } from '../../../utils/constants'

Page({
  data: {
    userInfo: null as any,
    avatarText: '管',
    todayDate: '',
    pendingCount: 0,
    todayWorkerRecords: 0,
    todayDriverRecords: 0,
    totalWorkers: 0,
    totalDrivers: 0,
    loading: false,
  },

  onLoad() {
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    this.setData({ todayDate: todayStr })
    this.loadUserInfo()
    this.loadStats()
  },

  onShow() {
    this.loadStats()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
  },

  onPullDownRefresh() {
    Promise.all([this.loadUserInfo(), this.loadStats()]).finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  async loadUserInfo() {
    const stored = getUserInfo()
    if (stored) {
      const name = stored.name || stored.realName || '管理员'
      this.setData({ userInfo: stored, avatarText: name.charAt(0) })
    }
    try {
      const user = await getCurrentUser()
      if (user) {
        const name = user.name || user.realName || '管理员'
        this.setData({ userInfo: user, avatarText: name.charAt(0) })
      }
    } catch (err) {
      console.error('获取用户信息失败', err)
    }
  },

  async loadStats() {
    this.setData({ loading: true })
    try {
      const stats: any = await getAdminDashboardStats()
      this.setData({
        pendingCount: stats?.pendingCount || 0,
        todayWorkerRecords: stats?.todayWorkerRecords || 0,
        todayDriverRecords: stats?.todayDriverRecords || 0,
        totalWorkers: stats?.totalWorkers || 0,
        totalDrivers: stats?.totalDrivers || 0,
      })
    } catch (err) {
      console.error('加载统计失败', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  goBatchReview() {
    wx.switchTab({ url: '/pages/admin/batch-review/index' })
  },

  goWorkerRecords() {
    wx.navigateTo({ url: '/pages/admin/worker-records/index' })
  },

  goDriverRecords() {
    wx.navigateTo({ url: '/pages/admin/driver-records/index' })
  },

  goAttendanceRecords() {
    wx.switchTab({ url: '/pages/admin/attendance-records/index' })
  },
})
