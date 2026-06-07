import { getCurrentUser, getDriverBatches } from '../../../utils/api'
import { clearLoginState, getUserInfo } from '../../../utils/auth'
import { BATCH_STATUS } from '../../../utils/constants'

Page({
  data: {
    userInfo: null as any,
    displayName: '司机',
    avatarLetter: '司',
    todayStr: '',
    draftCount: 0,
    pendingCount: 0,
    approvedCount: 0,
  },

  onLoad() {
    this.setTodayStr()
    const userInfo = getUserInfo()
    if (userInfo) {
      this.setData({
        userInfo,
        displayName: userInfo.name || '司机',
        avatarLetter: (userInfo.name || '司')[0],
      })
    }
  },

  onShow() {
    this.loadUserInfo()
    this.loadBatchStats()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
  },

  setTodayStr() {
    const now = new Date()
    const str = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
    this.setData({ todayStr: str })
  },

  async loadUserInfo() {
    try {
      const res: any = await getCurrentUser()
      this.setData({
        userInfo: res,
        displayName: res?.name || '司机',
        avatarLetter: (res?.name || '司')[0],
      })
    } catch (err) {
      console.error('获取用户信息失败', err)
    }
  },

  async loadBatchStats() {
    try {
      const list: any[] = await getDriverBatches()
      const draftCount = list.filter(b => b.status === BATCH_STATUS.PENDING || b.status === BATCH_STATUS.WITHDRAWN).length
      const pendingCount = list.filter(b => b.status === BATCH_STATUS.PENDING).length
      const approvedCount = list.filter(b => b.status === BATCH_STATUS.APPROVED).length
      this.setData({ draftCount, pendingCount, approvedCount })
    } catch (err) {
      console.error('获取批次统计失败', err)
    }
  },

  /** 上报考勤 */
  goCreateBatch() {
    wx.navigateTo({ url: '/pages/driver/batch-create/index' })
  },

  /** 批次记录 */
  goBatchList() {
    wx.switchTab({ url: '/pages/driver/batch-list/index' })
  },

  /** 常用工人 */
  goWorkers() {
    wx.switchTab({ url: '/pages/driver/workers/index' })
  },

  /** 个人中心 */
  goProfile() {
    wx.switchTab({ url: '/pages/driver/profile/index' })
  },
})
