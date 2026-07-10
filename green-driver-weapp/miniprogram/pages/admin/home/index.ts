import { getAdminDashboardStats, getCurrentUser, getUnresolvedAnomalyCount } from '../../../utils/api'
import { getUserInfo } from '../../../utils/auth'
import { BATCH_STATUS_TEXT } from '../../../utils/constants'

function getTodayChina(): string {
  const now = new Date()
  const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  return chinaTime.toISOString().split('T')[0]
}

Page({
  data: {
    userInfo: null as any,
    avatarText: '管',
    todayDate: '',
    pendingCount: 0,
    todayWorkerRecords: 0,
    todayDriverRecords: 0,
    anomalyCount: 0,
    loading: false,
  },

  onLoad() {
    const todayStr = getTodayChina()
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
      const [stats, anomalyStats] = await Promise.all([
        getAdminDashboardStats(),
        getUnresolvedAnomalyCount().catch(() => ({ count: 0 })),
      ])
      this.setData({
        pendingCount: stats?.pendingCount || 0,
        todayWorkerRecords: stats?.todayWorkerRecords || 0,
        todayDriverRecords: stats?.todayDriverRecords || 0,
        anomalyCount: anomalyStats?.count || 0,
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
    const today = getTodayChina()
    wx.navigateTo({ url: `/pages/admin/worker-records/index?dateFrom=${today}&dateTo=${today}` })
  },

  goDriverRecords() {
    const today = getTodayChina()
    wx.navigateTo({ url: `/pages/admin/driver-records/index?dateFrom=${today}&dateTo=${today}` })
  },

  goAttendanceRecords() {
    wx.switchTab({ url: '/pages/admin/attendance-records/index' })
  },

  goWorkerList() {
    wx.navigateTo({ url: '/pages/admin/worker-list/index' })
  },

  goDriverList() {
    wx.navigateTo({ url: '/pages/admin/driver-list/index' })
  },

  goAnomalies() {
    wx.navigateTo({ url: '/pages/admin/anomalies/index' })
  },
})
