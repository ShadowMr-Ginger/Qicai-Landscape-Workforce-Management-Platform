import { getDriverBatches, getDriverBatchDetail, withdrawBatch, deleteDriverBatch } from '../../../utils/api'
import { BATCH_STATUS, BATCH_STATUS_TEXT, BATCH_STATUS_COLOR, ATTENDANCE_TYPE_TEXT } from '../../../utils/constants'

Page({
  data: {
    batches: [] as any[],
    filteredBatches: [] as any[],
    loading: false,
    activeTab: 0, // 0-草稿(待审核+已撤回) 1-历史(已通过+不通过)
    tabOptions: ['草稿', '历史记录'],

    // 详情弹窗
    showDetail: false,
    detailBatch: null as any,
    detailWorkers: [] as any[],
  },

  onLoad() {
    this.loadBatches()
  },

  onShow() {
    // 每次显示都刷新数据（兼容 onShow 不触发的情况）
    this.loadBatches()
    const app = getApp() as any
    if (app && app.globalData) {
      app.globalData._refreshBatchList = false
    }
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  /** 页面可见时强制刷新（兼容 onShow 不触发的情况） */
  forceRefresh() {
    this.loadBatches()
  },

  onPullDownRefresh() {
    this.loadBatches().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  async loadBatches() {
    this.setData({ loading: true })
    try {
      const list = await getDriverBatches()
      const batches = list || []
      this.setData({ batches })
      this.updateFilteredBatches(batches, this.data.activeTab)
    } catch (err) {
      console.error('加载批次失败', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  /** 显式刷新按钮 */
  onRefreshTap() {
    this.loadBatches()
  },

  updateFilteredBatches(batches: any[], activeTab: number) {
    if (activeTab === 0) {
      this.setData({
        filteredBatches: batches.filter(b => Number(b.status) === BATCH_STATUS.PENDING || Number(b.status) === BATCH_STATUS.WITHDRAWN)
      })
    } else {
      this.setData({
        filteredBatches: batches.filter(b => Number(b.status) === BATCH_STATUS.APPROVED || Number(b.status) === BATCH_STATUS.REJECTED)
      })
    }
  },

  switchTab(e: any) {
    const activeTab = parseInt(e.currentTarget.dataset.index)
    this.setData({ activeTab })
    this.updateFilteredBatches(this.data.batches, activeTab)
  },

  getStatusClass(status: number) {
    return BATCH_STATUS_COLOR[Number(status)] || ''
  },

  getStatusText(status: number) {
    return BATCH_STATUS_TEXT[Number(status)] || '未知'
  },

  preventBubble() {
    // 阻止事件冒泡
  },



  /** 撤回批次 */
  async onWithdraw(e: any) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认撤回',
      content: '撤回后批次将变为草稿状态，可重新编辑',
      confirmColor: '#16a34a',
      success: async (res) => {
        if (res.confirm) {
          try {
            await withdrawBatch(id)
            wx.showToast({ title: '撤回成功', icon: 'success' })
            this.loadBatches()
          } catch (err: any) {
            wx.showToast({ title: err.message || '撤回失败', icon: 'none' })
          }
        }
      },
    })
  },

  /** 删除批次 */
  async onDelete(e: any) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定删除此批次？',
      confirmColor: '#ef4444',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteDriverBatch(id)
            wx.showToast({ title: '删除成功', icon: 'success' })
            this.loadBatches()
          } catch (err: any) {
            wx.showToast({ title: err.message || '删除失败', icon: 'none' })
          }
        }
      },
    })
  },

  /** 打开批次详情 */
  async openDetail(e: any) {
    const id = Number(e.currentTarget.dataset.id)
    const batch = this.data.filteredBatches.find((b: any) => Number(b.id) === id)
    try {
      const detail = await getDriverBatchDetail(id)
      const workers = (detail && Array.isArray(detail.workerRecords)) ? detail.workerRecords : []
      const cleanWorkers = JSON.parse(JSON.stringify(workers))
      // 合并详情接口返回的数据，确保状态等字段最新
      const detailBatch = detail ? { ...batch, ...detail } : batch
      console.log('批次详情工人数量:', cleanWorkers.length, cleanWorkers)
      this.setData({ showDetail: true, detailBatch: detailBatch || null, detailWorkers: cleanWorkers })
    } catch (err) {
      console.error('加载详情失败', err)
      this.setData({ showDetail: true, detailBatch: batch || null, detailWorkers: [] })
    }
  },

  closeDetail() {
    this.setData({ showDetail: false, detailBatch: null, detailWorkers: [] })
  },

  getAttendanceTypeText(type: number) {
    return ATTENDANCE_TYPE_TEXT[type] || '未知'
  },

  /** 重新编辑（已撤回的批次） */
  onEdit(e: any) {
    const batch = e.currentTarget.dataset.batch
    wx.navigateTo({
      url: `/pages/driver/batch-create/index?editMode=true&batchId=${batch.id}`,
    })
  },
})
