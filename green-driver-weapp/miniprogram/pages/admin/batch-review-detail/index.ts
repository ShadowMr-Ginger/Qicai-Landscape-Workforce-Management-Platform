import { getAdminBatchDetail, reviewBatch, rejectBatch, getAdminProjects, getAdminWorkTypes } from '../../../utils/api'
import { BATCH_STATUS_TEXT } from '../../../utils/constants'

Page({
  data: {
    batchId: null as number | null,
    batch: null as any,
    workers: [] as any[],
    driverRecord: null as any,
    loading: false,
    submitting: false,
    // 工人编辑弹窗
    editPanelOpen: false,
    editingWorkerIndex: -1,
    editingWorker: null as any,
    attendanceTypeOptions: ['全天', '半天'],
    projectOptions: [] as any[],
    workTypeOptions: [] as any[],
    // 批量设置项目
    batchProjectIndex: -1,
  },

  onLoad(options: any) {
    const id = parseInt(options.id)
    this.setData({ batchId: id })
    this.loadDetail(id)
  },

  async loadDetail(id: number) {
    this.setData({ loading: true })
    try {
      const detail: any = await getAdminBatchDetail(id)
      const driverRecord = detail.driverRecord || this.buildDefaultDriverRecord(detail)
      const [projectOptions, workTypeOptions] = await Promise.all([
        getAdminProjects().catch(() => []),
        getAdminWorkTypes().catch(() => []),
      ])
      this.setData({
        batch: detail,
        workers: detail.workerRecords || [],
        driverRecord,
        projectOptions: projectOptions || [],
        workTypeOptions: workTypeOptions || [],
      })
    } catch (err) {
      console.error('加载详情失败', err)
      wx.showToast({ title: '加载详情失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  buildDefaultDriverRecord(detail: any) {
    return {
      id: null,
      driverId: detail.driverId,
      driverName: detail.driverName || '司机',
      attendanceType: 2,
      attendanceTypeText: '全天',
      overtimeHours: 0,
      dailyWage: 0,
      overtimeWage: 0,
      totalWage: 0,
      remark: detail.remark || '',
    }
  },

  onDriverOvertimeChange(e: any) {
    const record = { ...this.data.driverRecord, overtimeHours: parseFloat(e.detail.value) || 0 }
    const rate = record.overtimeHourlyRate || 0
    const dailyWage = record.dailyWage || 0
    const overtimeWage = Math.round(rate * record.overtimeHours * 100) / 100
    const totalWage = Math.round((dailyWage + overtimeWage) * 100) / 100
    this.setData({
      driverRecord: { ...record, dailyWage, overtimeWage, totalWage },
    })
  },

  onDriverDailyWageChange(e: any) {
    const dailyWage = parseFloat(e.detail.value) || 0
    const overtimeWage = this.data.driverRecord.overtimeWage || 0
    const totalWage = Math.round((dailyWage + overtimeWage) * 100) / 100
    this.setData({
      driverRecord: { ...this.data.driverRecord, dailyWage, totalWage },
    })
  },

  onDriverRemarkChange(e: any) {
    this.setData({
      driverRecord: { ...this.data.driverRecord, remark: e.detail.value },
    })
  },

  // 打开工人编辑弹窗
  openWorkerEdit(e: any) {
    if (this.data.batch?.status !== 0) return
    const index = e.currentTarget.dataset.index
    const worker = this.data.workers[index]
    let projectIndex = this.data.projectOptions.findIndex((p: any) => p.id === worker.projectId)
    // 如果工人没有分配项目，默认选中系统默认项目
    if (projectIndex < 0) {
      projectIndex = this.data.projectOptions.findIndex((p: any) => p.isSystem === 1 || p.projectName === '默认')
    }
    const workTypeIndex = this.data.workTypeOptions.findIndex((wt: any) => wt.id === worker.workTypeId)
    this.setData({
      editPanelOpen: true,
      editingWorkerIndex: index,
      editingWorker: {
        ...worker,
        projectIndex: projectIndex >= 0 ? projectIndex : 0,
        workTypeIndex: workTypeIndex >= 0 ? workTypeIndex : 0,
      },
    })
  },

  // 阻止事件冒泡（无需额外逻辑）
  preventClose() {
    // do nothing
  },

  // 关闭编辑弹窗
  closeWorkerEdit() {
    this.setData({
      editPanelOpen: false,
      editingWorkerIndex: -1,
      editingWorker: null,
    })
  },

  // 出勤类型选择变化
  onWorkerAttendanceTypeChange(e: any) {
    const idx = e.detail.value
    const attendanceType = idx === '1' ? 1 : 2
    const next = { ...this.data.editingWorker, attendanceType }
    this.setData({
      editingWorker: this.recalcWorkerWages(next),
    })
  },

  // 加班时长变化
  onWorkerOvertimeChange(e: any) {
    const next = { ...this.data.editingWorker, overtimeHours: parseFloat(e.detail.value) || 0 }
    this.setData({
      editingWorker: this.recalcWorkerWages(next),
    })
  },

  // 日薪变化
  onWorkerDailyWageChange(e: any) {
    const dailyWage = parseFloat(e.detail.value) || 0
    const next = { ...this.data.editingWorker, dailyWage }
    const overtimeWage = next.overtimeWage || 0
    next.totalWage = Math.round((dailyWage + overtimeWage) * 100) / 100
    this.setData({ editingWorker: next })
  },

  // 备注变化
  onWorkerRemarkChange(e: any) {
    this.setData({
      editingWorker: { ...this.data.editingWorker, remark: e.detail.value },
    })
  },

  // 工地项目选择变化（单工人编辑）
  onWorkerProjectChange(e: any) {
    const idx = parseInt(e.detail.value)
    const project = this.data.projectOptions[idx]
    if (project) {
      this.setData({
        editingWorker: {
          ...this.data.editingWorker,
          projectId: project.id,
          projectName: project.projectName,
          projectIndex: idx,
        },
      })
    }
  },

  // 批量设置项目选择变化
  onBatchProjectChange(e: any) {
    this.setData({ batchProjectIndex: parseInt(e.detail.value) })
  },

  // 应用批量项目设置
  applyBatchProject() {
    const idx = this.data.batchProjectIndex
    if (idx < 0 || idx >= this.data.projectOptions.length) {
      wx.showToast({ title: '请先选择项目', icon: 'none' })
      return
    }
    const project = this.data.projectOptions[idx]
    const workers = this.data.workers.map((w: any) => ({
      ...w,
      projectId: project.id,
      projectName: project.projectName,
    }))
    this.setData({ workers, batchProjectIndex: -1 })
    wx.showToast({ title: `已批量设置为${project.projectName}`, icon: 'success' })
  },

  // 作业类型选择变化
  onWorkerWorkTypeChange(e: any) {
    const idx = parseInt(e.detail.value)
    const wt = this.data.workTypeOptions[idx]
    if (wt) {
      this.setData({
        editingWorker: {
          ...this.data.editingWorker,
          workTypeId: wt.id,
          workTypeName: wt.typeName,
          workTypeIndex: idx,
        },
      })
    }
  },

  // 重算工人工资
  recalcWorkerWages(worker: any) {
    const base = worker.baseDailySalary || 0
    const rate = worker.overtimeHourlyRate || 0
    const attendanceType = worker.attendanceType
    const overtimeHours = worker.overtimeHours || 0
    const dailyWage = attendanceType === 1 ? Math.round((base / 2) * 100) / 100 : base
    const overtimeWage = Math.round(rate * overtimeHours * 100) / 100
    const totalWage = Math.round((dailyWage + overtimeWage) * 100) / 100
    return { ...worker, dailyWage, overtimeWage, totalWage }
  },

  // 保存工人编辑
  saveWorkerEdit() {
    const index = this.data.editingWorkerIndex
    if (index < 0 || !this.data.editingWorker) return
    const workers = [...this.data.workers]
    workers[index] = this.data.editingWorker
    this.setData({
      workers,
      editPanelOpen: false,
      editingWorkerIndex: -1,
      editingWorker: null,
    })
    wx.showToast({ title: '已更新', icon: 'success' })
  },

  async onApprove() {
    const id = this.data.batchId
    if (!id) return
    wx.showModal({
      title: '确认审核通过',
      content: '确定通过此考勤批次？',
      confirmColor: '#16a34a',
      success: async (res) => {
        if (res.confirm) {
          this.setData({ submitting: true })
          try {
            const driverRecord = this.data.driverRecord
            const payload: any = {
              batchId: id,
              workerRecords: this.data.workers.map((w: any) => ({
                recordId: w.id,
                workTypeId: w.workTypeId,
                projectId: w.projectId,
                attendanceType: w.attendanceType,
                overtimeHours: w.overtimeHours,
                dailyWage: w.dailyWage,
                overtimeWage: w.overtimeWage,
                totalWage: w.totalWage,
                remark: w.remark,
              })),
            }
            if (driverRecord?.id) {
              payload.driverRecord = {
                recordId: driverRecord.id,
                overtimeHours: driverRecord.overtimeHours,
                dailyWage: driverRecord.dailyWage,
                remark: driverRecord.remark,
              }
            }
            await reviewBatch(id, payload)
            wx.showToast({ title: '审核通过', icon: 'success' })
            setTimeout(() => wx.navigateBack(), 1000)
          } catch (err: any) {
            wx.showToast({ title: err.message || '审核失败', icon: 'none' })
          } finally {
            this.setData({ submitting: false })
          }
        }
      },
    })
  },

  async onReject() {
    const id = this.data.batchId
    if (!id) return
    wx.showModal({
      title: '确认不予通过',
      content: '确定不通过此考勤批次？',
      confirmColor: '#ef4444',
      success: async (res) => {
        if (res.confirm) {
          this.setData({ submitting: true })
          try {
            await rejectBatch(id)
            wx.showToast({ title: '已拒绝', icon: 'success' })
            setTimeout(() => wx.navigateBack(), 1000)
          } catch (err: any) {
            wx.showToast({ title: err.message || '操作失败', icon: 'none' })
          } finally {
            this.setData({ submitting: false })
          }
        }
      },
    })
  },

  getStatusText(status: number) {
    return BATCH_STATUS_TEXT[Number(status)] || '未知'
  },
})
