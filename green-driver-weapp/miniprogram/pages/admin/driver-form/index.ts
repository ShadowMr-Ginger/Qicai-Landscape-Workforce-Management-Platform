import { getDriverDetail, createDriver, updateDriver } from '../../../utils/api'

interface SalaryDefaults {
  maleBase: number
  femaleBase: number
  overtimeRate: number
}

function getDefaults(): SalaryDefaults {
  let defaults: SalaryDefaults = { maleBase: 120, femaleBase: 90, overtimeRate: 15 }
  try {
    const raw = wx.getStorageSync('driverDefaultSalary')
    if (raw) defaults = { ...defaults, ...JSON.parse(raw) }
  } catch {
    // ignore
  }
  return defaults
}

function computeSalary(gender: string) {
  const defaults = getDefaults()
  return {
    baseDailySalary: String(gender === '1' ? defaults.maleBase : defaults.femaleBase),
    overtimeHourlyRate: String(defaults.overtimeRate),
  }
}

Page({
  data: {
    mode: 'create',
    id: null as number | null,
    form: {
      name: '',
      gender: '1',
      phone: '',
      idCard: '',
      baseDailySalary: '',
      overtimeHourlyRate: '',
      emergencyContactPhone: '',
    },
  },

  onLoad(options: any) {
    const mode = options.mode || 'create'
    this.setData({ mode })
    if (mode === 'edit' && options.id) {
      const id = Number(options.id)
      this.setData({ id })
      this.loadDetail(id)
    } else {
      const { baseDailySalary, overtimeHourlyRate } = computeSalary(this.data.form.gender)
      this.setData({ form: { ...this.data.form, baseDailySalary, overtimeHourlyRate } })
      wx.setNavigationBarTitle({ title: '新增司机' })
    }
  },

  async loadDetail(id: number) {
    try {
      const res: any = await getDriverDetail(id)
      const d = res?.data || res
      if (d) {
        // 后端司机性别：1-男，0-女
        const gender = d.genderText === '女' ? '0' : '1'
        this.setData({
          form: {
            name: d.realName || '',
            gender,
            phone: d.phone || '',
            idCard: d.idCard || '',
            baseDailySalary: String(d.baseDailySalary || ''),
            overtimeHourlyRate: String(d.overtimeHourlyRate || ''),
            emergencyContactPhone: d.emergencyContactPhone || '',
          },
        })
        wx.setNavigationBarTitle({ title: '编辑司机' })
      }
    } catch (err) {
      console.error('加载司机详情失败', err)
      wx.showToast({ title: '加载详情失败', icon: 'none' })
    }
  },

  onFieldChange(e: any) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({ form: { ...this.data.form, [field]: value } })
  },

  onGenderChange(e: any) {
    // picker index 0=男 1=女
    const value = e.detail.value === '1' ? '0' : '1'
    const { baseDailySalary, overtimeHourlyRate } = computeSalary(value)
    this.setData({ form: { ...this.data.form, gender: value, baseDailySalary, overtimeHourlyRate } })
  },

  async handleSave() {
    const { form, mode, id } = this.data
    if (!form.name.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }
    const payload: any = {
      realName: form.name.trim(),
      gender: Number(form.gender),
      phone: form.phone || undefined,
      idCard: form.idCard || undefined,
      baseDailySalary: Number(form.baseDailySalary) || 0,
      overtimeHourlyRate: Number(form.overtimeHourlyRate) || 0,
      emergencyContactPhone: form.emergencyContactPhone || undefined,
    }
    try {
      if (mode === 'edit' && id) {
        await updateDriver(id, payload)
        wx.showToast({ title: '修改成功', icon: 'success' })
      } else {
        await createDriver(payload)
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
