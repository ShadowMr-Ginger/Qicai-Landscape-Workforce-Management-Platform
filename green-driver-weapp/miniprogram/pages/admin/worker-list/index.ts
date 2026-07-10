import { getAdminWorkers, getAdminGroups, resignWorker, restoreWorker, deleteWorker, getWorkerAttendanceCount } from '../../../utils/api'

Page({
  data: {
    workers: [] as any[],
    loading: false,
    keyword: '',
    gender: '',
    isSkilled: '',
    groupId: '',
    showResigned: false,
    managing: false,
    total: 0,
    groups: [] as any[],
    groupIndex: 0,
    groupName: '',
  },

  onLoad() {
    this.loadGroups()
    this.loadWorkers()
  },

  onShow() {
    this.loadWorkers()
  },

  onPullDownRefresh() {
    this.loadWorkers().finally(() => wx.stopPullDownRefresh())
  },

  async loadGroups() {
    try {
      const res: any = await getAdminGroups()
      this.setData({ groups: res?.data || res || [] })
    } catch (err) {
      console.error('加载组别失败', err)
    }
  },

  async loadWorkers() {
    this.setData({ loading: true })
    try {
      const params: any = {
        isEmployed: this.data.showResigned ? 0 : 1,
        pageNum: 1,
        pageSize: 100,
      }
      if (this.data.keyword) params.keyword = this.data.keyword
      if (this.data.gender) params.gender = Number(this.data.gender)
      if (this.data.isSkilled) params.isSkilledWorker = Number(this.data.isSkilled)
      if (this.data.groupId) params.groupId = Number(this.data.groupId)
      const res: any = await getAdminWorkers(params)
      const list = res?.records || res || []
      this.setData({ workers: list, total: res?.total || list.length })
    } catch (err) {
      console.error('加载工人列表失败', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onKeywordInput(e: any) {
    this.setData({ keyword: e.detail.value })
  },

  onGenderChange(e: any) {
    // 0=全部 1=男 2=女
    const value = e.detail.value
    this.setData({ gender: value === '0' ? '' : value })
    this.loadWorkers()
  },

  onIsSkilledChange(e: any) {
    const value = e.detail.value
    this.setData({ isSkilled: value === '0' ? '' : String(Number(value) - 1) })
    this.loadWorkers()
  },

  onGroupChange(e: any) {
    const index = Number(e.detail.value)
    const group = this.data.groups[index]
    this.setData({
      groupIndex: index,
      groupId: group ? String(group.id) : '',
      groupName: group ? group.name : '',
    })
    this.loadWorkers()
  },

  doSearch() {
    this.loadWorkers()
  },

  resetFilter() {
    this.setData({ keyword: '', gender: '', isSkilled: '', groupId: '', groupIndex: 0, groupName: '' })
    this.loadWorkers()
  },

  toggleShowResigned() {
    this.setData({ showResigned: !this.data.showResigned, managing: false })
    this.loadWorkers()
  },

  toggleManaging() {
    this.setData({ managing: !this.data.managing })
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/admin/worker-form/index?mode=create' })
  },

  goEdit(e: any) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/admin/worker-form/index?mode=edit&id=${id}` })
  },

  handleResign(e: any) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name
    wx.showModal({
      title: '确认离职',
      content: `确定要将工人 ${name} 设置为离职状态吗？`,
      confirmColor: '#ea580c',
      success: async (res) => {
        if (res.confirm) {
          try {
            await resignWorker(id)
            wx.showToast({ title: '已设置为离职', icon: 'success' })
            this.loadWorkers()
          } catch (err) {
            console.error('离职失败', err)
          }
        }
      },
    })
  },

  handleRestore(e: any) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name
    wx.showModal({
      title: '确认恢复在职',
      content: `确定要将工人 ${name} 恢复为在职状态吗？`,
      confirmColor: '#16a34a',
      success: async (res) => {
        if (res.confirm) {
          try {
            await restoreWorker(id)
            wx.showToast({ title: '已恢复在职', icon: 'success' })
            this.loadWorkers()
          } catch (err) {
            console.error('恢复在职失败', err)
          }
        }
      },
    })
  },

  async handleDelete(e: any) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name
    let count = 0
    try {
      const res: any = await getWorkerAttendanceCount(id)
      count = res || 0
    } catch {
      count = 0
    }
    wx.showModal({
      title: '危险操作：删除工人',
      content: `该工人关联有 ${count} 条考勤记录，删除工人将同时删除这些考勤记录，操作不可撤销！`,
      confirmColor: '#dc2626',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteWorker(id)
            wx.showToast({ title: '删除成功', icon: 'success' })
            this.loadWorkers()
          } catch (err) {
            console.error('删除失败', err)
          }
        }
      },
    })
  },
})
