import { getAdminBatches } from '../../../utils/api'
import { BATCH_STATUS_TEXT, BATCH_STATUS_COLOR } from '../../../utils/constants'

Page({
  data: {
    batches: [] as any[],
    loading: false,
    statusFilter: '0',
    dateFrom: '',
    dateTo: '',
  },

  onLoad() {
    this.loadBatches()
  },

  onShow() {
    this.loadBatches()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  onPullDownRefresh() {
    this.loadBatches().finally(() => wx.stopPullDownRefresh())
  },

  async loadBatches() {
    this.setData({ loading: true })
    try {
      const params: any = { pageSize: 100 }
      if (this.data.statusFilter !== '') params.status = this.data.statusFilter
      if (this.data.dateFrom) params.dateFrom = this.data.dateFrom
      if (this.data.dateTo) params.dateTo = this.data.dateTo
      const res: any = await getAdminBatches(params)
      const rawList = res?.records || res || []
      // 预处理每个 item，避免 WXML 中频繁方法调用
      const list = rawList.map((item: any) => ({
        ...item,
        _cardClass: this.getCardClass(item.status),
        _statusText: this.getStatusText(item.status),
        _statusClass: this.getStatusClass(item.status),
      }))
      this.setData({ batches: list })
    } catch (err) {
      console.error('加载批次失败', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  onStatusChange(e: any) {
    const statusMap = ['', '0', '1', '2', '3']
    this.setData({ statusFilter: statusMap[e.detail.value] || '' })
    this.loadBatches()
  },

  onDateFromChange(e: any) {
    this.setData({ dateFrom: e.detail.value })
    this.loadBatches()
  },

  onDateToChange(e: any) {
    this.setData({ dateTo: e.detail.value })
    this.loadBatches()
  },

  resetFilter() {
    this.setData({ statusFilter: '0', dateFrom: '', dateTo: '' })
    this.loadBatches()
  },

  goDetail(e: any) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/admin/batch-review-detail/index?id=${id}` })
  },

  getStatusText(status: number) {
    return BATCH_STATUS_TEXT[Number(status)] || '未知'
  },

  getStatusClass(status: number) {
    return BATCH_STATUS_COLOR[Number(status)] || ''
  },

  getCardClass(status: number) {
    const map: Record<number, string> = {
      0: 'card-pending',
      1: 'card-approved',
      2: 'card-withdrawn',
      3: 'card-rejected',
    }
    return map[Number(status)] || ''
  },
})
