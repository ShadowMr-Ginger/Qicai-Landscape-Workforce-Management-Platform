import { getAdminWorkers, getWorkerWageSummary } from '../../../utils/api'

Page({
  data: {
    groups: [] as any[],
    loading: false,
  },

  onLoad() {
    this.loadWorkers()
  },

  onPullDownRefresh() {
    this.loadWorkers().finally(() => wx.stopPullDownRefresh())
  },

  async loadWorkers() {
    this.setData({ loading: true })
    try {
      const res: any = await getAdminWorkers({ isEmployed: 1, pageSize: 1000 })
      const workerList = res?.records || res || []
      // 按组别分组
      const groupMap: Record<string, any[]> = {}
      workerList.forEach((w: any) => {
        const g = w.groupName || '未分组'
        if (!groupMap[g]) groupMap[g] = []
        groupMap[g].push(w)
      })
      const groups = Object.entries(groupMap).map(([name, list]) => ({
        name,
        workers: list,
        expanded: false,
      }))
      this.setData({ groups })
    } catch (err) {
      console.error('加载工人失败', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  toggleGroup(e: any) {
    const index = e.currentTarget.dataset.index
    const groups = [...this.data.groups]
    groups[index].expanded = !groups[index].expanded
    this.setData({ groups })
    if (groups[index].expanded && !groups[index].workers[0]?._summaryLoaded) {
      this.loadGroupSummaries(index)
    }
  },

  async loadGroupSummaries(groupIndex: number) {
    const groups = [...this.data.groups]
    const workers = groups[groupIndex].workers
    await Promise.all(
      workers.map(async (w: any) => {
        try {
          const summary = await getWorkerWageSummary(w.id)
          w.summary = summary
          w._summaryLoaded = true
        } catch (err) {
          console.error('加载汇总失败', err)
        }
      })
    )
    this.setData({ groups })
  },
})
