"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  CheckCircle,
  Plus,
  ClipboardCheck,
  RotateCcw,
  Eye,
  Pencil,
  Building2,
  Wrench,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getAttendanceBatchList,
  createAttendanceBatch,
  getAttendanceBatchDetail,
  reviewAttendanceBatch,
  getDriverList,
  getWorkerList,
  getGroupList,
  getWorkTypeList,
  getAllProjects,
} from "@/lib/api";

interface BatchItem {
  id: number;
  driverName: string;
  batchDate: string;
  status: number;
  statusText: string;
  totalWorkers: number;
  submitTime: string;
  remark: string;
}

interface DriverOption {
  id: number;
  realName: string;
}

interface WorkerOption {
  id: number;
  name: string;
  groupName: string;
  groupId: number;
}

interface BatchWorkerRecord {
  id: number;
  workerId: number;
  workerName: string;
  groupName: string;
  projectId: number | null;
  projectName: string;
  workTypeId: number | null;
  workTypeName: string;
  attendanceType: number;
  attendanceTypeText: string;
  overtimeHours: number;
  dailyWage: number;
  overtimeWage: number;
  totalWage: number;
  baseDailySalary: number;
  overtimeHourlyRate: number;
  remark: string;
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getWeekAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("0");
  const [dateFrom, setDateFrom] = useState(getWeekAgo());
  const [dateTo, setDateTo] = useState(getToday());

  // 创建弹窗
  const [createOpen, setCreateOpen] = useState(false);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [workers, setWorkers] = useState<WorkerOption[]>([]);
  const [groupOptions, setGroupOptions] = useState<{ id: number; groupName: string }[]>([]);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [batchDate, setBatchDate] = useState(getToday());
  const [selectedWorkers, setSelectedWorkers] = useState<number[]>([]);
  const [remark, setRemark] = useState("");
  const [workerKeyword, setWorkerKeyword] = useState("");
  const [workerGroupFilter, setWorkerGroupFilter] = useState("");
  const [batchAttendanceType, setBatchAttendanceType] = useState("2");
  const [batchOvertimeHours, setBatchOvertimeHours] = useState("0");
  const [batchWorkTypeId, setBatchWorkTypeId] = useState("");
  const [workTypeOptions, setWorkTypeOptions] = useState<{ id: number; typeName: string }[]>([]);

  // 详情/审核弹窗
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailBatch, setDetailBatch] = useState<any>(null);
  const [detailRecords, setDetailRecords] = useState<BatchWorkerRecord[]>([]);
  const [projectOptions, setProjectOptions] = useState<{ id: number; projectName: string }[]>([]);
  const [reviewing, setReviewing] = useState(false);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await getAttendanceBatchList({
        pageNum: 1,
        pageSize: 100,
        status: statusFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      if (res.code === 200 && res.data?.records) {
        setBatches(res.data.records);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "获取批次列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchDrivers = async () => {
    try {
      const res = await getDriverList({ pageNum: 1, pageSize: 1000 });
      if (res.code === 200 && res.data?.records) {
        setDrivers(res.data.records);
      }
    } catch { /* ignore */ }
  };

  const fetchWorkers = async () => {
    try {
      const res = await getWorkerList({ pageNum: 1, pageSize: 1000, isEmployed: 1 });
      if (res.code === 200 && res.data?.records) {
        setWorkers(res.data.records);
      }
    } catch { /* ignore */ }
  };

  const fetchGroups = async () => {
    try {
      const res = await getGroupList();
      if (res.code === 200 && res.data) {
        setGroupOptions(res.data);
      }
    } catch { /* ignore */ }
  };

  const fetchWorkTypes = async () => {
    try {
      const res = await getWorkTypeList();
      if (res.code === 200 && res.data) {
        setWorkTypeOptions(res.data);
      }
    } catch { /* ignore */ }
  };

  const fetchProjects = async () => {
    try {
      const res = await getAllProjects();
      if (res.code === 200 && res.data) {
        setProjectOptions(res.data);
      }
    } catch { /* ignore */ }
  };

  const openCreate = () => {
    setSelectedDriver("");
    setBatchDate(getToday());
    setSelectedWorkers([]);
    setRemark("");
    setWorkerKeyword("");
    setWorkerGroupFilter("");
    setBatchAttendanceType("2");
    setBatchOvertimeHours("0");
    setBatchWorkTypeId("");
    fetchDrivers();
    fetchWorkers();
    fetchGroups();
    fetchWorkTypes();
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!selectedDriver) {
      toast.error("请选择审核司机");
      return;
    }
    if (!batchDate) {
      toast.error("请选择考勤日期");
      return;
    }
    if (selectedWorkers.length === 0) {
      toast.error("请至少选择一名工人");
      return;
    }
    if (!batchWorkTypeId) {
      toast.error("请选择作业类型");
      return;
    }
    try {
      await createAttendanceBatch({
        driverId: Number(selectedDriver),
        batchDate,
        workers: selectedWorkers.map((wid) => ({ workerId: wid })),
        attendanceType: Number(batchAttendanceType),
        overtimeHours: Number(batchOvertimeHours) || 0,
        workTypeId: Number(batchWorkTypeId),
        remark,
      });
      toast.success("考勤批次创建成功，请等待审核");
      setCreateOpen(false);
      fetchBatches();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "创建失败");
    }
  };

  const openDetail = async (batch: BatchItem) => {
    try {
      const res = await getAttendanceBatchDetail(batch.id);
      if (res.code === 200 && res.data) {
        setDetailBatch(res.data);
        setDetailRecords(res.data.workerRecords || []);
        await fetchWorkTypes();
        await fetchProjects();
        setDetailOpen(true);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "获取批次详情失败");
    }
  };

  const handleReview = async () => {
    if (!detailBatch) return;
    setReviewing(true);
    try {
      await reviewAttendanceBatch(detailBatch.id, {
        batchId: detailBatch.id,
        workerRecords: detailRecords.map((r) => ({
          recordId: r.id,
          workTypeId: r.workTypeId,
          projectId: r.projectId,
          attendanceType: r.attendanceType,
          overtimeHours: r.overtimeHours,
          dailyWage: r.dailyWage,
          overtimeWage: r.overtimeWage,
          totalWage: r.totalWage,
          remark: r.remark,
        })),
      });
      toast.success("审核通过");
      setDetailOpen(false);
      fetchBatches();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "审核失败");
    } finally {
      setReviewing(false);
    }
  };

  /** 根据出勤类型和加班时长重新计算工资 */
  const recalcWages = (record: BatchWorkerRecord) => {
    const base = Number(record.baseDailySalary) || 0;
    const rate = Number(record.overtimeHourlyRate) || 0;
    const attendanceType = record.attendanceType;
    const overtimeHours = Number(record.overtimeHours) || 0;
    const dailyWage = attendanceType === 1 ? Math.round((base / 2) * 100) / 100 : base;
    const overtimeWage = Math.round(rate * overtimeHours * 100) / 100;
    const totalWage = Math.round((dailyWage + overtimeWage) * 100) / 100;
    return { dailyWage, overtimeWage, totalWage };
  };

  const handleReset = () => {
    setStatusFilter("0");
    setDateFrom(getWeekAgo());
    setDateTo(getToday());
    fetchBatches();
  };

  const filteredWorkers = workers.filter((w) => {
    if (workerKeyword && !w.name.includes(workerKeyword)) return false;
    if (workerGroupFilter && String(w.groupId) !== workerGroupFilter) return false;
    return true;
  });

  const statusBadge = (status: number) => {
    if (status === 0)
      return <Badge variant="outline" className="rounded-md text-orange-600 border-orange-200 bg-orange-50">待审核</Badge>;
    if (status === 1)
      return <Badge variant="outline" className="rounded-md text-green-600 border-green-200 bg-green-50">已通过</Badge>;
    return <Badge variant="outline" className="rounded-md text-gray-600 border-gray-200 bg-gray-50">已撤回</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">考勤审核</h2>
        <Button
          variant="default"
          size="sm"
          className="rounded-lg bg-green-600 hover:bg-green-700"
          onClick={openCreate}
        >
          <Plus className="w-4 h-4 mr-1" />
          新增批次
        </Button>
      </div>

      {/* 筛选 */}
      <Card className="border-0 shadow-sm rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">状态</Label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-28"
              >
                <option value="">全部</option>
                <option value="0">待审核</option>
                <option value="1">已通过</option>
                <option value="2">已撤回</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">开始日期</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 rounded-lg w-40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">结束日期</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 rounded-lg w-40" />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm" className="rounded-lg h-9" onClick={handleReset}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                重置
              </Button>
              <Button size="sm" className="rounded-lg h-9 bg-green-600 hover:bg-green-700" onClick={fetchBatches}>
                <Search className="w-3.5 h-3.5 mr-1" />
                查询
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 表格 */}
      <Card className="border-0 shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="text-gray-600 font-medium">审核司机</TableHead>
                <TableHead className="text-gray-600 font-medium">考勤日期</TableHead>
                <TableHead className="text-gray-600 font-medium">状态</TableHead>
                <TableHead className="text-gray-600 font-medium">工人数</TableHead>
                <TableHead className="text-gray-600 font-medium">提交时间</TableHead>
                <TableHead className="text-gray-600 font-medium">备注</TableHead>
                <TableHead className="text-gray-600 font-medium w-32">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-gray-400">
                    <ClipboardCheck className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    暂无考勤批次
                  </TableCell>
                </TableRow>
              ) : (
                batches.map((batch) => (
                  <TableRow key={batch.id} className="hover:bg-green-50/30 transition-colors">
                    <TableCell className="font-medium text-gray-800">{batch.driverName}</TableCell>
                    <TableCell className="text-gray-600">{batch.batchDate}</TableCell>
                    <TableCell>{statusBadge(batch.status)}</TableCell>
                    <TableCell className="text-gray-600">{batch.totalWorkers} 人</TableCell>
                    <TableCell className="text-gray-500 text-xs">{batch.submitTime}</TableCell>
                    <TableCell className="text-gray-500 text-xs max-w-[200px] truncate">{batch.remark || "-"}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => openDetail(batch)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        查看
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 新增批次弹窗 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-600" />
              新增考勤批次
            </DialogTitle>
            <DialogDescription>选择审核司机、考勤日期、统一考勤信息并添加参与工人</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>审核司机 <span className="text-red-500">*</span></Label>
                <select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">请选择</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.realName}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>考勤日期 <span className="text-red-500">*</span></Label>
                <Input type="date" value={batchDate} onChange={(e) => setBatchDate(e.target.value)} className="rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>出勤类型 <span className="text-red-500">*</span></Label>
                <select
                  value={batchAttendanceType}
                  onChange={(e) => setBatchAttendanceType(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="2">全天</option>
                  <option value="1">半天</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>加班时长(小时)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={batchOvertimeHours}
                  onChange={(e) => setBatchOvertimeHours(e.target.value)}
                  className="rounded-lg h-10"
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label>作业类型 <span className="text-red-500">*</span></Label>
                <select
                  value={batchWorkTypeId}
                  onChange={(e) => setBatchWorkTypeId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">请选择</option>
                  {workTypeOptions.map((wt) => (
                    <option key={wt.id} value={wt.id}>{wt.typeName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>选择工人 <span className="text-red-500">*</span></Label>
              <div className="flex gap-2">
                <Input
                  placeholder="搜索工人姓名"
                  value={workerKeyword}
                  onChange={(e) => setWorkerKeyword(e.target.value)}
                  className="rounded-lg h-9 text-sm"
                />
                <select
                  value={workerGroupFilter}
                  onChange={(e) => setWorkerGroupFilter(e.target.value)}
                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-32 shrink-0"
                >
                  <option value="">全部组别</option>
                  {groupOptions.map((g) => (
                    <option key={g.id} value={g.id}>{g.groupName}</option>
                  ))}
                </select>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-100 p-2 space-y-1">
                {filteredWorkers.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-2">暂无符合条件的工人</p>
                ) : (
                  filteredWorkers.map((w) => (
                    <label
                      key={w.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-green-50/30 cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedWorkers.includes(w.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWorkers([...selectedWorkers, w.id]);
                          } else {
                            setSelectedWorkers(selectedWorkers.filter((id) => id !== w.id));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-gray-700">{w.name}</span>
                      <span className="text-xs text-gray-400">{w.groupName || "未分组"}</span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-400">已选择 {selectedWorkers.length} 人</p>
            </div>
            <div className="space-y-1.5">
              <Label>备注</Label>
              <Input value={remark} onChange={(e) => setRemark(e.target.value)} className="rounded-lg" placeholder="选填" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button className="rounded-lg bg-green-600 hover:bg-green-700" onClick={handleCreate}>提交批次</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 详情/审核弹窗 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-green-600" />
              批次详情
            </DialogTitle>
            <DialogDescription>
              审核司机：{detailBatch?.driverName} · 考勤日期：{detailBatch?.batchDate} · 状态：{detailBatch?.statusText}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {detailRecords.map((record, idx) => {
              const isEditing = detailBatch?.status === 0;
              return (
                <div key={record.id} className="rounded-xl border border-gray-100 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                        {record.workerName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{record.workerName}</p>
                        <p className="text-[10px] text-gray-400">{record.groupName || "未分组"}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-green-700">¥{record.totalWage.toFixed(2)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-gray-400">出勤</Label>
                      {isEditing ? (
                        <select
                          value={record.attendanceType}
                          onChange={(e) => {
                            const newRecords = [...detailRecords];
                            newRecords[idx].attendanceType = Number(e.target.value);
                            const wages = recalcWages(newRecords[idx]);
                            newRecords[idx].dailyWage = wages.dailyWage;
                            newRecords[idx].overtimeWage = wages.overtimeWage;
                            newRecords[idx].totalWage = wages.totalWage;
                            setDetailRecords(newRecords);
                          }}
                          className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs"
                        >
                          <option value={2}>全天</option>
                          <option value={1}>半天</option>
                        </select>
                      ) : (
                        <p className="text-xs text-gray-700">{record.attendanceTypeText}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-gray-400">加班(小时)</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={record.overtimeHours}
                          onChange={(e) => {
                            const newRecords = [...detailRecords];
                            newRecords[idx].overtimeHours = Number(e.target.value);
                            const wages = recalcWages(newRecords[idx]);
                            newRecords[idx].dailyWage = wages.dailyWage;
                            newRecords[idx].overtimeWage = wages.overtimeWage;
                            newRecords[idx].totalWage = wages.totalWage;
                            setDetailRecords(newRecords);
                          }}
                          className="h-8 rounded-lg text-xs px-2"
                        />
                      ) : (
                        <p className="text-xs text-gray-700">{record.overtimeHours}h</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-gray-400">作业类型</Label>
                      {isEditing ? (
                        <select
                          value={record.workTypeId || ""}
                          onChange={(e) => {
                            const newRecords = [...detailRecords];
                            newRecords[idx].workTypeId = e.target.value ? Number(e.target.value) : null;
                            setDetailRecords(newRecords);
                          }}
                          className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs"
                        >
                          <option value="">请选择</option>
                          {workTypeOptions.map((wt) => (
                            <option key={wt.id} value={wt.id}>{wt.typeName}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-xs text-gray-700">{record.workTypeName || "-"}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-gray-400">项目</Label>
                      {isEditing ? (
                        <select
                          value={record.projectId || ""}
                          onChange={(e) => {
                            const newRecords = [...detailRecords];
                            newRecords[idx].projectId = e.target.value ? Number(e.target.value) : null;
                            setDetailRecords(newRecords);
                          }}
                          className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs"
                        >
                          <option value="">请选择</option>
                          {projectOptions.map((p) => (
                            <option key={p.id} value={p.id}>{p.projectName}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-xs text-gray-700">{record.projectName || "-"}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-gray-400">日薪(元)</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={record.dailyWage}
                          onChange={(e) => {
                            const newRecords = [...detailRecords];
                            const dailyWage = Number(e.target.value) || 0;
                            const overtimeWage = newRecords[idx].overtimeWage || 0;
                            newRecords[idx].dailyWage = dailyWage;
                            newRecords[idx].totalWage = Math.round((dailyWage + overtimeWage) * 100) / 100;
                            setDetailRecords(newRecords);
                          }}
                          className="h-8 rounded-lg text-xs px-2"
                        />
                      ) : (
                        <p className="text-xs text-gray-700">¥{record.dailyWage}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-gray-400">加班工资(元)</Label>
                      <p className="text-xs text-gray-700">¥{record.overtimeWage}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-between text-xs text-gray-500 px-1">
              <span>共 {detailRecords.length} 人</span>
              <span>
                合计工资：¥{detailRecords.reduce((sum, r) => sum + (r.totalWage || 0), 0).toFixed(2)}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setDetailOpen(false)}>
              关闭
            </Button>
            {detailBatch?.status === 0 && (
              <Button
                className="rounded-lg bg-green-600 hover:bg-green-700"
                onClick={handleReview}
                disabled={reviewing}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                {reviewing ? "审核中..." : "保存并审核通过"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
