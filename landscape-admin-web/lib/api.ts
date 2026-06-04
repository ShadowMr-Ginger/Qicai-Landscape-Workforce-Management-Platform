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
 * <p>1. 后端全局异常处理器返回 HTTP 200 但业务 code 非 200 时，转为错误抛出</p>
 * <p>2. 401 时自动清除 Token 并跳转登录页</p>
 */
api.interceptors.response.use(
  (response) => {
    // 后端包装了业务错误但 HTTP 状态码仍是 200，需要检查业务 code
    if (response.data && typeof response.data.code === 'number' && response.data.code !== 200) {
      return Promise.reject({
        response: {
          status: response.data.code,
          data: response.data,
        },
        message: response.data.message,
      });
    }
    return response;
  },
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

export async function createWorker(data: Record<string, unknown>) {
  const res = await api.post('/admin/workers', data);
  return res.data;
}

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

export async function createDriver(data: Record<string, unknown>) {
  const res = await api.post('/admin/drivers', data);
  return res.data;
}

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
