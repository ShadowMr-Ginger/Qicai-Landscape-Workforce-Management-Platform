import { getWorkerAttendanceRecords } from '../../../utils/api'

Page({
  data: {
    records: [] as any[],
    loading: false,
    workerName: '',
    dateFrom: '',
    dateTo: '',
  },

  onLoad() {
    this.loadRecords()
  },

  onPullDownRefresh() {
    this.loadRecords().finally(() => wx.stopPullDownRefresh())
  },

  async loadRecords() {
    this.setData({ loading: true })
    try {
      const params: any = { pageSize: 100 }
      if (this.data.workerName) params.workerName = this.data.workerName
      if (this.data.dateFrom) params.dateFrom = this.data.dateFrom
      if (this.data.dateTo) params.dateTo = this.data.dateTo
      const res: any = await getWorkerAttendanceRecords(params)
      const list = res?.records || res || []
      this.setData({ records: list })
    } catch (err) {
      console.error('加载记录失败', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  onNameInput(e: any) {
    this.setData({ workerName: e.detail.value })
  },

  onDateFromChange(e: any) {
    this.setData({ dateFrom: e.detail.value })
    this.loadRecords()
  },

  onDateToChange(e: any) {
    this.setData({ dateTo: e.detail.value })
    this.loadRecords()
  },

  doSearch() {
    this.loadRecords()
  },

  resetFilter() {
    this.setData({ workerName: '', dateFrom: '', dateTo: '' })
    this.loadRecords()
  },
})
