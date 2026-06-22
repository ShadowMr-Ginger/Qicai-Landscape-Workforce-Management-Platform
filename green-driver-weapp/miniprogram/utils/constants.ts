// 注意：本项目微信小程序实际运行的是同目录下的 constants.js
// 微信开发者工具未启用 TypeScript 编译插件，修改本文件后需手动同步到 constants.js
// API 基础地址
export const API_BASE_URL = 'https://www.qicaiyuanlin.cn/api'

// 本地存储键名
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_TYPE: 'userType',
  USER_INFO: 'userInfo',
  WX_BOUND: 'wxBound',
}

// 批次状态
export const BATCH_STATUS = {
  PENDING: 0,    // 待审核
  APPROVED: 1,   // 已通过
  WITHDRAWN: 2,  // 已撤回
  REJECTED: 3,   // 不通过
}

export const BATCH_STATUS_TEXT: Record<number, string> = {
  0: '待审核',
  1: '已通过',
  2: '已撤回',
  3: '不通过',
}

export const BATCH_STATUS_COLOR: Record<number, string> = {
  0: 'badge-orange',
  1: 'badge-green',
  2: 'badge-blue',
  3: 'badge-red',
}

// 出勤类型
export const ATTENDANCE_TYPE = {
  HALF: 1,
  FULL: 2,
}

export const ATTENDANCE_TYPE_TEXT: Record<number, string> = {
  1: '半天',
  2: '全天',
}
