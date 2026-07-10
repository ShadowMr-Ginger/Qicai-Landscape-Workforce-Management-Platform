import { getAdminDrivers, resignDriver, restoreDriver, deleteDriver, getDriverAttendanceCount, resetDriverPassword } from '../../../utils/api'

Page({
  data: {
    drivers: [] as any[],
    loading: false,
    keyword: '',
    gender: '',
    showResigned: false,
    managing: false,
    total: 0,
  },

  onLoad() {
    this.loadDrivers()
  },

  onShow() {
    this.loadDrivers()
  },

  onPullDownRefresh() {
    this.loadDrivers().then(
      () => wx.stopPullDownRefresh(),
      () => wx.stopPullDownRefresh()
    )
  },

  async loadDrivers() {
    this.setData({ loading: true })
    try {
      const params: any = {
        isActive: this.data.showResigned ? 0 : 1,
        pageNum: 1,
        pageSize: 100,
      }
      if (this.data.keyword) params.keyword = this.data.keyword
      if (this.data.gender !== '') params.gender = Number(this.data.gender)
      const res: any = await getAdminDrivers(params)
      const list = res?.records || res || []
      this.setData({ drivers: list, total: res?.total || list.length })
    } catch (err) {
      console.error('加载司机列表失败', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onKeywordInput(e: any) {
    this.setData({ keyword: e.detail.value })
  },

  onGenderChange(e: any) {
    // picker index 0=全部 1=男 2=女；后端 1=男 0=女
    const index = Number(e.detail.value)
    const value = index === 0 ? '' : (index === 1 ? '1' : '0')
    this.setData({ gender: value })
    this.loadDrivers()
  },

  doSearch() {
    this.loadDrivers()
  },

  resetFilter() {
    this.setData({ keyword: '', gender: '' })
    this.loadDrivers()
  },

  toggleShowResigned() {
    this.setData({ showResigned: !this.data.showResigned, managing: false })
    this.loadDrivers()
  },

  toggleManaging() {
    this.setData({ managing: !this.data.managing })
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/admin/driver-form/index?mode=create' })
  },

  goEdit(e: any) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/admin/driver-form/index?mode=edit&id=${id}` })
  },

  handleResign(e: any) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name
    wx.showModal({
      title: '确认离职',
      content: `确定要将司机 ${name} 设置为离职状态吗？`,
      confirmColor: '#ea580c',
      success: async (res) => {
        if (res.confirm) {
          try {
            await resignDriver(id)
            wx.showToast({ title: '已设置为离职', icon: 'success' })
            this.loadDrivers()
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
      content: `确定要将司机 ${name} 恢复为在职状态吗？`,
      confirmColor: '#16a34a',
      success: async (res) => {
        if (res.confirm) {
          try {
            await restoreDriver(id)
            wx.showToast({ title: '已恢复在职', icon: 'success' })
            this.loadDrivers()
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
      const res: any = await getDriverAttendanceCount(id)
      count = res || 0
    } catch {
      count = 0
    }
    wx.showModal({
      title: '危险操作：删除司机',
      content: `该司机关联有 ${count} 条考勤记录，删除将同时删除这些记录，操作不可撤销！`,
      confirmColor: '#dc2626',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteDriver(id)
            wx.showToast({ title: '删除成功', icon: 'success' })
            this.loadDrivers()
          } catch (err) {
            console.error('删除失败', err)
          }
        }
      },
    })
  },

  handleResetPwd(e: any) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name
    wx.showModal({
      title: '确认重置密码',
      content: `确定要重置司机 ${name} 的密码为 123456 吗？`,
      confirmColor: '#9333ea',
      success: async (res) => {
        if (res.confirm) {
          try {
            await resetDriverPassword(id)
            wx.showToast({ title: '密码已重置', icon: 'success' })
          } catch (err) {
            console.error('重置密码失败', err)
          }
        }
      },
    })
  },
})
