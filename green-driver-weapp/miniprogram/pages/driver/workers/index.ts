import { getFavoriteWorkers, searchAvailableWorkers, addFavoriteWorker, removeFavoriteWorker } from '../../../utils/api'

Page({
  data: {
    favoriteWorkers: [] as any[],
    searchKeyword: '',
    searchResults: [] as any[],
    showSearch: false,
    loading: false,
  },

  onLoad() {
    this.loadFavorites()
  },

  onShow() {
    this.loadFavorites()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
  },

  async loadFavorites() {
    this.setData({ loading: true })
    try {
      const list = await getFavoriteWorkers()
      this.setData({ favoriteWorkers: list || [] })
    } catch (err) {
      console.error('加载常用工人失败', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  async toggleSearch() {
    const showSearch = !this.data.showSearch
    this.setData({ showSearch, searchKeyword: '', searchResults: [] })
    if (showSearch) {
      // 展开搜索面板时，立即加载全部可选工人
      try {
        const list = await searchAvailableWorkers('')
        this.setData({ searchResults: list || [] })
      } catch (err) {
        console.error('加载可选工人失败', err)
      }
    }
  },

  onSearchInput(e: any) {
    this.setData({ searchKeyword: e.detail.value })
  },

  async doSearch() {
    const keyword = this.data.searchKeyword.trim()
    try {
      const list = await searchAvailableWorkers(keyword)
      this.setData({ searchResults: list || [] })
    } catch (err) {
      console.error('搜索失败', err)
    }
  },

  async onAddWorker(e: any) {
    const workerId = e.currentTarget.dataset.id
    try {
      await addFavoriteWorker(workerId)
      wx.showToast({ title: '添加成功', icon: 'success' })
      this.setData({ showSearch: false, searchKeyword: '', searchResults: [] })
      this.loadFavorites()
    } catch (err: any) {
      wx.showToast({ title: err.message || '添加失败', icon: 'none' })
    }
  },

  async onRemoveWorker(e: any) {
    const workerId = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认移除',
      content: '确定从常用列表移除此工人？',
      confirmColor: '#ef4444',
      success: async (res) => {
        if (res.confirm) {
          try {
            await removeFavoriteWorker(workerId)
            wx.showToast({ title: '移除成功', icon: 'success' })
            this.loadFavorites()
          } catch (err: any) {
            wx.showToast({ title: err.message || '移除失败', icon: 'none' })
          }
        }
      },
    })
  },
})
