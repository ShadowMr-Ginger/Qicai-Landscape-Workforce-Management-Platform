/**
 * 全局类型定义
 *
 * <p>集中管理前端项目中的 TypeScript 类型，确保类型安全。</p>
 */

/**
 * 用户信息
 */
export interface UserInfo {
  userId: number;
  userType: 'ADMIN' | 'DRIVER';
  name: string;
  roleName?: string;
}

/**
 * 登录响应
 */
export interface LoginResponse {
  token: string;
  userInfo: UserInfo;
  firstLogin?: boolean;
}

/**
 * 通用 API 响应
 */
export interface ApiResult<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}
