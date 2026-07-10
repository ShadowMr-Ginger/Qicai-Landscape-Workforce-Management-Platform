import { getWorkerDetail, createWorker, updateWorker, getAdminGroups } from '../../../utils/api'

interface SalaryDefaults {
  maleBase: number
  femaleBase: number
  overtimeRate: number
  skilledExtra: number
}

function getDefaults(): SalaryDefaults {
  let defaults: SalaryDefaults = { maleBase: 120, femaleBase: 90, overtimeRate: 15, skilledExtra: 30 }
  try {
    const raw = wx.getStorageSync('workerDefaultSalary')
    if (raw) defaults = { ...defaults, ...JSON.parse(raw) }
  } catch {
    // ignore
  }
  return defaults
}

function computeSalary(gender: string, isSkilledWorker: string) {
  const defaults = getDefaults()
  const base = gender === '1' ? defaults.maleBase : defaults.femaleBase
  const extra = isSkilledWorker === '1' ? defaults.skilledExtra : 0
  return {
    baseDailySalary: String(base + extra),
    overtimeHourlyRate: String(defaults.overtimeRate),
  }
}

Page({
  data: {
    mode: 'create',
    id: null as number | null,
    groupOptions: [] as any[],
    groupIndex: 0,
    groupName: '',
    form: {
      name: '',
      gender: '1',
      phone: '',
      baseDailySalary: '',
      overtimeHourlyRate: '',
      isSkilledWorker: '0',
      groupId: '',
      idCard: '',
      emergencyContactPhone: '',
    },
  },

  onLoad(options: any) {
    const mode = options.mode || 'create'
    this.setData({ mode })
    this.loadGroups().then(() => {
      if (mode === 'edit' && options.id) {
        const id = Number(options.id)
        this.setData({ id })
        this.loadDetail(id)
      } else {
        const { baseDailySalary, overtimeHourlyRate } = computeSalary(this.data.form.gender, this.data.form.isSkilledWorker)
        this.setData({
          form: { ...this.data.form, baseDailySalary, overtimeHourlyRate },
        })
        wx.setNavigationBarTitle({ title: '新增工人' })
      }
    })
  },

  async loadGroups() {
    try {
      const res: any = await getAdminGroups()
      const list = res?.data || res || []
      this.setData({ groupOptions: list })
    } catch (err) {
      console.error('加载组别失败', err)
    }
  },

  setGroupIndex(groupId: string | number) {
    const id = String(groupId)
    const index = this.data.groupOptions.findIndex((g: any) => String(g.id) === id)
    const name = index >= 0 ? this.data.groupOptions[index].groupName : ''
    this.setData({ groupIndex: index >= 0 ? index : 0, groupName: name })
  },

  async loadDetail(id: number) {
    try {
      const res: any = await getWorkerDetail(id)
      const d = res?.data || res
      if (d) {
        const gender = d.genderText === '女' ? '2' : '1'
        const isSkilledWorker = d.isSkilledWorkerText === '是' ? '1' : '0'
        this.setData({
          form: {
            name: d.name || '',
            gender,
            phone: d.phone || '',
            baseDailySalary: String(d.baseDailySalary || ''),
            overtimeHourlyRate: String(d.overtimeHourlyRate || ''),
            isSkilledWorker,
            groupId: String(d.groupId || ''),
            idCard: d.idCard || '',
            emergencyContactPhone: d.emergencyContactPhone || '',
          },
        })
        this.setGroupIndex(d.groupId)
        wx.setNavigationBarTitle({ title: '编辑工人' })
      }
    } catch (err) {
      console.error('加载工人详情失败', err)
      wx.showToast({ title: '加载详情失败', icon: 'none' })
    }
  },

  onFieldChange(e: any) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({ form: { ...this.data.form, [field]: value } })
  },

  onGenderChange(e: any) {
    const value = e.detail.value === '1' ? '2' : '1'
    const { baseDailySalary, overtimeHourlyRate } = computeSalary(value, this.data.form.isSkilledWorker)
    this.setData({ form: { ...this.data.form, gender: value, baseDailySalary, overtimeHourlyRate } })
  },

  onSkilledChange(e: any) {
    const value = e.detail.value === '1' ? '1' : '0'
    const { baseDailySalary, overtimeHourlyRate } = computeSalary(this.data.form.gender, value)
    this.setData({ form: { ...this.data.form, isSkilledWorker: value, baseDailySalary, overtimeHourlyRate } })
  },

  onGroupChange(e: any) {
    const index = Number(e.detail.value)
    const group = this.data.groupOptions[index]
    if (group) {
      this.setData({
        groupIndex: index,
        groupName: group.groupName,
        form: { ...this.data.form, groupId: String(group.id) },
      })
    }
  },

  async handleSave() {
    const { form, mode, id } = this.data
    if (!form.name.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }
    if (!form.groupId) {
      wx.showToast({ title: '请选择组别', icon: 'none' })
      return
    }
    const payload: any = {
      name: form.name.trim(),
      gender: Number(form.gender),
      phone: form.phone || undefined,
      baseDailySalary: Number(form.baseDailySalary) || 0,
      overtimeHourlyRate: Number(form.overtimeHourlyRate) || 0,
      isSkilledWorker: Number(form.isSkilledWorker),
      groupId: Number(form.groupId),
      idCard: form.idCard || undefined,
      emergencyContactPhone: form.emergencyContactPhone || undefined,
    }
    try {
      if (mode === 'edit' && id) {
        await updateWorker(id, payload)
        wx.showToast({ title: '修改成功', icon: 'success' })
      } else {
        await createWorker(payload)
        wx.showToast({ title: '新增成功', icon: 'success' })
      }
      setTimeout(() => wx.navigateBack(), 800)
    } catch (err: any) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    }
  },

  handleCancel() {
    wx.navigateBack()
  },
})
