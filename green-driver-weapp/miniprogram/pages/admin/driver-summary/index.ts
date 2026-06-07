import { getAdminDrivers, getDriverWageSummary } from '../../../utils/api'

Page({
  data: {
    drivers: [] as any[],
    loading: false,
  },

  onLoad() {
    this.loadDrivers()
  },

  onPullDownRefresh() {
    this.loadDrivers().finally(() => wx.stopPullDownRefresh())
  },

  async loadDrivers() {
    this.setData({ loading: true })
    try {
      const res: any = await getAdminDrivers()
      const driverList = res?.records || res || []
      this.setData({ drivers: driverList.map((d: any) => ({ ...d, summary: null, _summaryLoaded: false })) })
      this.loadAllSummaries()
    } catch (err) {
      console.error('加载司机失败', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  async loadAllSummaries() {
    const drivers = [...this.data.drivers]
    await Promise.all(
      drivers.map(async (d) => {
        try {
          const summary = await getDriverWageSummary(d.id)
          d.summary = summary
          d._summaryLoaded = true
        } catch (err) {
          console.error('加载汇总失败', err)
        }
      })
    )
    this.setData({ drivers })
  },
})
