Component({
  data: {
    selected: 0,
    isAdmin: false,
    driverList: [
      { pagePath: '/pages/driver/home/index', text: '首页', icon: '🏠' },
      { pagePath: '/pages/driver/batch-list/index', text: '记录', icon: '📋' },
      { pagePath: '/pages/driver/workers/index', text: '工人', icon: '👷' },
      { pagePath: '/pages/driver/profile/index', text: '我的', icon: '👤' },
    ],
    adminList: [
      { pagePath: '/pages/admin/home/index', text: '首页', icon: '🏠' },
      { pagePath: '/pages/admin/batch-review/index', text: '审核', icon: '✅' },
      { pagePath: '/pages/admin/attendance-records/index', text: '记录', icon: '📊' },
      { pagePath: '/pages/admin/profile/index', text: '我的', icon: '👤' },
    ]
  },

  lifetimes: {
    attached() {
      this.updateTabBar()
    }
  },

  pageLifetimes: {
    show() {
      this.updateTabBar()
    }
  },

  methods: {
    updateTabBar() {
      // 1. 优先从 app.globalData 获取用户类型（最可靠）
      const app = getApp()
      let isAdmin = this.data.isAdmin
      if (app && app.globalData) {
        if (app.globalData.userType === 'admin') {
          isAdmin = true
        } else if (app.globalData.userType === 'driver') {
          isAdmin = false
        }
      }

      // 2. 兜底：通过当前页面路径判断
      const pages = getCurrentPages()
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1]
        let route = ''
        try {
          route = currentPage.route || ''
        } catch (e) {
          route = ''
        }
        if (route) {
          const fullPath = '/' + route
          const adminIndex = this.data.adminList.findIndex((item: any) => item.pagePath === fullPath)
          const driverIndex = this.data.driverList.findIndex((item: any) => item.pagePath === fullPath)
          if (adminIndex >= 0) {
            isAdmin = true
          } else if (driverIndex >= 0) {
            isAdmin = false
          }
        }
      }

      // 3. 计算当前选中索引
      let selected = 0
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1]
        let route = ''
        try {
          route = currentPage.route || ''
        } catch (e) {
          route = ''
        }
        if (route) {
          const fullPath = '/' + route
          const list = isAdmin ? this.data.adminList : this.data.driverList
          selected = list.findIndex((item: any) => item.pagePath === fullPath)
          if (selected < 0) selected = 0
        }
      }

      this.setData({ isAdmin, selected })
    },

    switchTab(e: any) {
      const index = e.currentTarget.dataset.index
      const list = this.data.isAdmin ? this.data.adminList : this.data.driverList
      const path = list[index].pagePath
      wx.switchTab({ url: path })
    }
  }
})
