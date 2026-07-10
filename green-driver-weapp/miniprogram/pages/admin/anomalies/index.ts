import { getAnomalyList, runGlobalAnomalyCheck } from '../../../utils/api'

Page({
  data: {
    anomalies: [] as any[],
    loading: false,
    checking: false,
    total: 0,
  },

  onLoad() {
    this.runCheck()
  },

  onPullDownRefresh() {
    this.runCheck().finally(() => wx.stopPullDownRefresh())
  },

  async runCheck() {
    this.setData({ checking: true, loading: true })
    try {
      const checkRes: any = await runGlobalAnomalyCheck()
      const affected = checkRes?.affected || 0
      wx.showToast({ title: `发现 ${affected} 条异常`, icon: 'none' })
    } catch (err) {
      console.error('全局检测失败', err)
      wx.showToast({ title: '全局检测失败', icon: 'none' })
    } finally {
      this.setData({ checking: false })
    }
    await this.loadAnomalies()
  },

  async loadAnomalies() {
    this.setData({ loading: true })
    try {
      const res: any = await getAnomalyList({ status: 0, pageSize: 999 })
      const list = res?.records || res || []
      this.setData({
        anomalies: list,
        total: res?.total || list.length,
      })
    } catch (err) {
      console.error('加载异常记录失败', err)
      wx.showToast({ title: '加载异常记录失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },
})
