import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserInfo } from '@/types';

/**
 * 认证状态接口
 */
interface AuthState {
  /** JWT Token */
  token: string | null;
  /** 当前用户信息 */
  user: UserInfo | null;
  /** 侧边栏折叠状态 */
  sidebarCollapsed: boolean;
  /** 设置认证信息 */
  setAuth: (token: string, user: UserInfo) => void;
  /** 退出登录 */
  logout: () => void;
  /** 切换侧边栏折叠 */
  toggleSidebar: () => void;
}

/**
 * 认证状态管理 Store
 *
 * <p>使用 Zustand + persist 中间件实现，Token 持久化到 localStorage，刷新页面后保持登录态。</p>
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      sidebarCollapsed: false,
      setAuth: (token, user) => set({ token, user }),
      logout: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null });
      },
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
