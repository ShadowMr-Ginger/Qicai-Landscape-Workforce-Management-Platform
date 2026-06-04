import axios from 'axios';
import type { ApiResult } from '@/types';

/**
 * Axios 实例
 *
 * <p>封装后端 API 调用，统一处理请求头、错误响应和 Token 失效跳转。</p>
 */
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 请求拦截器：自动附加 JWT Token
 */
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

/**
 * 响应拦截器：统一错误处理
 * <p>401 时自动清除 Token 并跳转登录页</p>
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * 管理员登录
 */
export async function adminLogin(username: string, password: string): Promise<ApiResult<{ token: string; userInfo: { userId: number; userType: string; name: string } }>> {
  const res = await api.post('/auth/admin/login', { username, password });
  return res.data;
}

/**
 * 获取当前登录用户信息
 */
export async function getCurrentUser(): Promise<ApiResult<{ userId: number; userType: string; name: string }>> {
  const res = await api.get('/auth/current-user');
  return res.data;
}

/**
 * 退出登录
 */
export async function logout(): Promise<ApiResult<null>> {
  const res = await api.post('/auth/logout');
  return res.data;
}

// ==================== 工人管理 ====================

export async function getWorkerList(params: Record<string, unknown>) {
  const res = await api.get('/admin/workers', { params });
  return res.data;
}

export async function getWorkerDetail(id: number) {
  const res = await api.get(`/admin/workers/${id}`);
  return res.data;
}

export async function updateWorker(id: number, data: Record<string, unknown>) {
  const res = await api.put(`/admin/workers/${id}`, data);
  return res.data;
}

export async function resignWorker(id: number) {
  const res = await api.put(`/admin/workers/${id}/resign`);
  return res.data;
}

export async function deleteWorker(id: number) {
  const res = await api.delete(`/admin/workers/${id}`);
  return res.data;
}

// ==================== 司机管理 ====================

export async function getDriverList(params: Record<string, unknown>) {
  const res = await api.get('/admin/drivers', { params });
  return res.data;
}

export async function getDriverDetail(id: number) {
  const res = await api.get(`/admin/drivers/${id}`);
  return res.data;
}

export async function updateDriver(id: number, data: Record<string, unknown>) {
  const res = await api.put(`/admin/drivers/${id}`, data);
  return res.data;
}

export async function resignDriver(id: number) {
  const res = await api.put(`/admin/drivers/${id}/resign`);
  return res.data;
}

export async function deleteDriver(id: number) {
  const res = await api.delete(`/admin/drivers/${id}`);
  return res.data;
}

export default api;
