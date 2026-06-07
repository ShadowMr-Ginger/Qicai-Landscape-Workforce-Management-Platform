Page({
    onShow() {
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({ selected: 2 });
        }
    },
    goWorkerRecords() {
        wx.navigateTo({ url: '/pages/admin/worker-records/index' });
    },
    goDriverRecords() {
        wx.navigateTo({ url: '/pages/admin/driver-records/index' });
    },
    goWorkerSummary() {
        wx.navigateTo({ url: '/pages/admin/worker-summary/index' });
    },
    goDriverSummary() {
        wx.navigateTo({ url: '/pages/admin/driver-summary/index' });
    },
});
