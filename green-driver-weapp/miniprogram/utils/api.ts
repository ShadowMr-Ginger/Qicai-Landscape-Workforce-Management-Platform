import { API_BASE_URL, STORAGE_KEYS } from './constants'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
  noAuth?: boolean
}

/**
 * 统一请求封装
 */
export function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', data, header = {}, noAuth = false } = options

  return new Promise((resolve, reject) => {
    const reqHeader: Record<string, string> = {
      'Content-Type': 'application/json',
      ...header,
    }

    if (!noAuth) {
      const token = wx.getStorageSync(STORAGE_KEYS.TOKEN)
      if (token) {
        reqHeader.Authorization = `Bearer ${token}`
      }
    }

    const fullUrl = `${API_BASE_URL}${url}`
    console.log('[request]', method, fullUrl, 'token存在:', !!reqHeader.Authorization)

    wx.request({
      url: fullUrl,
      method,
      data,
      header: reqHeader,
      timeout: 10000,
      success: (res) => {
        const result = res.data as any
        console.log('[request success]', fullUrl, 'statusCode:', res.statusCode, 'code:', result?.code, 'msg:', result?.message)
        if (result.code === 200) {
          resolve(result.data)
        } else if (result.code === 401) {
          // Token 过期，清除登录态并跳转
          wx.removeStorageSync(STORAGE_KEYS.TOKEN)
          wx.removeStorageSync(STORAGE_KEYS.USER_TYPE)
          wx.removeStorageSync(STORAGE_KEYS.USER_INFO)
          wx.showToast({ title: '登录已过期', icon: 'none' })
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/index/index' })
          }, 1500)
          reject(new Error(result.message || '未登录'))
        } else {
          console.error('[request business error]', fullUrl, result)
          wx.showToast({ title: result.message || '请求失败', icon: 'none' })
          reject(new Error(result.message))
        }
      },
      fail: (err) => {
        console.error('[request fail]', fullUrl, err)
        let msg = '网络错误'
        if (err.errMsg && err.errMsg.includes('timeout')) {
          msg = '请求超时，请检查网络或后端服务'
        } else if (err.errMsg && err.errMsg.includes('fail')) {
          msg = '无法连接到服务器'
        }
        wx.showToast({ title: msg, icon: 'none' })
        reject(new Error(msg))
      },
    })
  })
}

// ==================== 认证相关 ====================

export function driverLogin(name: string, password: string) {
  return request('/auth/driver/login', {
    method: 'POST',
    data: { name, password },
    noAuth: true,
  })
}

export function driverWxLogin(wxCode: string) {
  return request('/auth/driver/wx-login', {
    method: 'POST',
    data: { wxCode },
    noAuth: true,
  })
}

export function getCurrentUser() {
  return request('/auth/current-user', { method: 'GET' })
}

export function logout() {
  return request('/auth/logout', { method: 'POST' })
}

export function driverChangePassword(oldPassword: string, newPassword: string) {
  return request('/driver/change-password', {
    method: 'POST',
    data: { oldPassword, newPassword },
  })
}

export function bindWechat(wxCode: string) {
  return request('/driver/bind-wx', {
    method: 'POST',
    data: { wxCode },
  })
}

// ==================== 常用工人 ====================

export function getFavoriteWorkers() {
  return request('/driver/favorite-workers', { method: 'GET' })
}

export function searchAvailableWorkers(keyword?: string) {
  return request(`/driver/favorite-workers/search?keyword=${encodeURIComponent(keyword || '')}`, { method: 'GET' })
}

export function addFavoriteWorker(workerId: number) {
  return request(`/driver/favorite-workers/${workerId}`, { method: 'POST' })
}

export function removeFavoriteWorker(workerId: number) {
  return request(`/driver/favorite-workers/${workerId}`, { method: 'DELETE' })
}

// ==================== 考勤批次 ====================

export function getDriverBatches(status?: number): Promise<any[]> {
  let url = '/driver/batches'
  if (status !== undefined) {
    url += `?status=${status}`
  }
  return request(url, { method: 'GET' })
}

export function getDriverBatchDetail(id: number): Promise<any> {
  return request(`/driver/batches/${id}`, { method: 'GET' })
}

export function createDriverBatch(data: any) {
  return request('/driver/batches', {
    method: 'POST',
    data,
  })
}

export function updateDriverBatch(id: number, data: any) {
  return request(`/driver/batches/${id}`, {
    method: 'PUT',
    data,
  })
}

export function withdrawBatch(id: number) {
  return request(`/driver/batches/${id}/withdraw`, { method: 'PUT' })
}

export function deleteDriverBatch(id: number) {
  return request(`/driver/batches/${id}`, { method: 'DELETE' })
}

// ==================== 作业类型 ====================

export function getWorkTypeList(): Promise<any[]> {
  return request('/driver/work-types', { method: 'GET' })
}

// ==================== 管理员相关 ====================

export function adminLogin(username: string, password: string) {
  return request('/auth/admin/login', {
    method: 'POST',
    data: { username, password },
    noAuth: true,
  })
}

export function adminWxLogin(wxCode: string) {
  return request('/auth/admin/wx-login', {
    method: 'POST',
    data: { wxCode },
    noAuth: true,
  })
}

export function bindAdminWechat(wxCode: string) {
  return request('/admin/bind-wx', {
    method: 'POST',
    data: { wxCode },
  })
}

// 管理员Dashboard统计
export function getAdminDashboardStats() {
  return request('/admin/attendance/dashboard/stats', { method: 'GET' })
}

// 考勤批次审核
export function getAdminBatches(params?: any) {
  let url = '/admin/attendance/batches'
  if (params) {
    const qs = Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&')
    if (qs) url += `?${qs}`
  }
  return request(url, { method: 'GET' })
}

export function getAdminBatchDetail(id: number) {
  return request(`/admin/attendance/batches/${id}`, { method: 'GET' })
}

export function reviewBatch(id: number, data: any) {
  return request(`/admin/attendance/batches/${id}/review`, {
    method: 'PUT',
    data,
  })
}

export function rejectBatch(id: number) {
  return request(`/admin/attendance/batches/${id}/reject`, { method: 'PUT' })
}

export function approveBatchSimple(id: number) {
  return request(`/admin/attendance/batches/${id}/approve`, { method: 'PUT' })
}

// 工人考勤记录
export function getWorkerAttendanceRecords(params?: any) {
  let url = '/admin/attendance/worker-records'
  if (params) {
    const qs = Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&')
    if (qs) url += `?${qs}`
  }
  return request(url, { method: 'GET' })
}

export function getWorkerAttendanceDetail(id: number) {
  return request(`/admin/attendance/worker-records/${id}`, { method: 'GET' })
}

// 司机考勤记录
export function getDriverAttendanceRecords(params?: any) {
  let url = '/admin/attendance/driver-records'
  if (params) {
    const qs = Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&')
    if (qs) url += `?${qs}`
  }
  return request(url, { method: 'GET' })
}

export function getDriverAttendanceDetail(id: number) {
  return request(`/admin/attendance/driver-records/${id}`, { method: 'GET' })
}

// 汇总统计
export function getWorkerWageSummary(workerId: number) {
  return request(`/admin/attendance/workers/${workerId}/wage-summary`, { method: 'GET' })
}

export function getDriverWageSummary(driverId: number) {
  return request(`/admin/attendance/drivers/${driverId}/wage-summary`, { method: 'GET' })
}

export function getWorkerCalendar(workerId: number, year: number, month: number) {
  return request(`/admin/attendance/workers/${workerId}/calendar?year=${year}&month=${month}`, { method: 'GET' })
}

export function getDriverCalendar(driverId: number, year: number, month: number) {
  return request(`/admin/attendance/drivers/${driverId}/calendar?year=${year}&month=${month}`, { method: 'GET' })
}

// 基础数据
export function getAdminWorkers(params?: any) {
  let url = '/admin/workers'
  if (params) {
    const qs = Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&')
    if (qs) url += `?${qs}`
  }
  return request(url, { method: 'GET' })
}

export function getAdminDrivers() {
  return request('/admin/drivers', { method: 'GET' })
}

export function getAdminProjects() {
  return request('/admin/projects/all', { method: 'GET' })
}

export function getAdminWorkTypes() {
  return request('/admin/work-types', { method: 'GET' })
}

export function getAdminGroups() {
  return request('/admin/groups', { method: 'GET' })
}
