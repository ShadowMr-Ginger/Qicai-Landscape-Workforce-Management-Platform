import { getDriverAttendanceRecords } from '../../../utils/api'

Page({
  data: {
    records: [] as any[],
    loading: false,
    driverName: '',
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
      if (this.data.driverName) params.driverName = this.data.driverName
      if (this.data.dateFrom) params.dateFrom = this.data.dateFrom
      if (this.data.dateTo) params.dateTo = this.data.dateTo
      const res: any = await getDriverAttendanceRecords(params)
      const list = res?.records || res || []
      this.setData({ records: list })
    } catch (err) {
      console.error('加载记录失败', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  onNameInput(e: any) {
    this.setData({ driverName: e.detail.value })
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
    this.setData({ driverName: '', dateFrom: '', dateTo: '' })
    this.loadRecords()
  },
})
