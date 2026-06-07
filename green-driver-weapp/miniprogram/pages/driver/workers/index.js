"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("../../../utils/api");
Page({
    data: {
        favoriteWorkers: [],
        searchKeyword: '',
        searchResults: [],
        showSearch: false,
        loading: false,
    },
    onLoad() {
        this.loadFavorites();
    },
    onShow() {
        this.loadFavorites();
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({ selected: 2 });
        }
    },
    loadFavorites() {
        return __awaiter(this, void 0, void 0, function* () {
            this.setData({ loading: true });
            try {
                const list = yield (0, api_1.getFavoriteWorkers)();
                this.setData({ favoriteWorkers: list || [] });
            }
            catch (err) {
                console.error('加载常用工人失败', err);
            }
            finally {
                this.setData({ loading: false });
            }
        });
    },
    toggleSearch() {
        return __awaiter(this, void 0, void 0, function* () {
            const showSearch = !this.data.showSearch;
            this.setData({ showSearch, searchKeyword: '', searchResults: [] });
            if (showSearch) {
                // 展开搜索面板时，立即加载全部可选工人
                try {
                    const list = yield (0, api_1.searchAvailableWorkers)('');
                    this.setData({ searchResults: list || [] });
                }
                catch (err) {
                    console.error('加载可选工人失败', err);
                }
            }
        });
    },
    onSearchInput(e) {
        this.setData({ searchKeyword: e.detail.value });
    },
    doSearch() {
        return __awaiter(this, void 0, void 0, function* () {
            const keyword = this.data.searchKeyword.trim();
            try {
                const list = yield (0, api_1.searchAvailableWorkers)(keyword);
                this.setData({ searchResults: list || [] });
            }
            catch (err) {
                console.error('搜索失败', err);
            }
        });
    },
    onAddWorker(e) {
        return __awaiter(this, void 0, void 0, function* () {
            const workerId = e.currentTarget.dataset.id;
            try {
                yield (0, api_1.addFavoriteWorker)(workerId);
                wx.showToast({ title: '添加成功', icon: 'success' });
                this.setData({ showSearch: false, searchKeyword: '', searchResults: [] });
                this.loadFavorites();
            }
            catch (err) {
                wx.showToast({ title: err.message || '添加失败', icon: 'none' });
            }
        });
    },
    onRemoveWorker(e) {
        return __awaiter(this, void 0, void 0, function* () {
            const workerId = e.currentTarget.dataset.id;
            wx.showModal({
                title: '确认移除',
                content: '确定从常用列表移除此工人？',
                confirmColor: '#ef4444',
                success: (res) => __awaiter(this, void 0, void 0, function* () {
                    if (res.confirm) {
                        try {
                            yield (0, api_1.removeFavoriteWorker)(workerId);
                            wx.showToast({ title: '移除成功', icon: 'success' });
                            this.loadFavorites();
                        }
                        catch (err) {
                            wx.showToast({ title: err.message || '移除失败', icon: 'none' });
                        }
                    }
                }),
            });
        });
    },
});
