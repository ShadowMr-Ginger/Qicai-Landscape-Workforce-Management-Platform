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
  Trash2,
  ShieldAlert,
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
import { Switch } from "@/components/ui/switch";
import {
  getAttendanceBatchList,
  createAttendanceBatch,
  getAttendanceBatchDetail,
  reviewAttendanceBatch,
  rejectAttendanceBatch,
  deleteAttendanceBatch,
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

interface BatchDriverRecord {
  id: number | null;
  driverId: number;
  driverName: string;
  attendanceDate: string;
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
  // 返回中国时间（UTC+8）的当天日期
  const now = new Date();
  const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return chinaTime.toISOString().split("T")[0];
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
  const [detailDriverRecord, setDetailDriverRecord] = useState<BatchDriverRecord | null>(null);
  const [projectOptions, setProjectOptions] = useState<{ id: number; projectName: string; isSystem?: number }[]>([]);
  const [defaultProjectId, setDefaultProjectId] = useState<number | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [batchToAction, setBatchToAction] = useState<BatchItem | null>(null);

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

  const fetchWorkTypes = async (autoSelectDefault = false) => {
    try {
      const res = await getWorkTypeList();
      if (res.code === 200 && res.data) {
        setWorkTypeOptions(res.data);
        if (autoSelectDefault) {
          const defaultType = res.data.find((wt: any) => wt.typeName === "默认");
          if (defaultType) {
            setBatchWorkTypeId(String(defaultType.id));
          }
        }
      }
    } catch { /* ignore */ }
  };

  const fetchProjects = async () => {
    try {
      const res = await getAllProjects();
      if (res.code === 200 && res.data) {
        setProjectOptions(res.data);
        const defaultProject = res.data.find((p: any) => p.isSystem === 1 || p.projectName === '默认');
        if (defaultProject) {
          setDefaultProjectId(defaultProject.id);
        }
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
    fetchWorkTypes(true);
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
        workers: selectedWorkers.map((wid) => ({ workerId: wid, remark: "" })),
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
        // 先加载项目列表以获取默认项目
        let defaultPid: number | null = null;
        let defaultPName = '';
        try {
          const projectRes = await getAllProjects();
          if (projectRes.code === 200 && projectRes.data) {
            setProjectOptions(projectRes.data);
            const defaultProject = projectRes.data.find((p: any) => p.isSystem === 1 || p.projectName === '默认');
            if (defaultProject) {
              defaultPid = defaultProject.id;
              defaultPName = defaultProject.projectName;
              setDefaultProjectId(defaultProject.id);
            }
          }
        } catch { /* ignore */ }
        const records = (res.data.workerRecords || []).map((r: any) => ({
          ...r,
          projectId: r.projectId ?? defaultPid,
          projectName: r.projectName ?? defaultPName,
        }));
        setDetailRecords(records);
        const rawDriver = res.data.driverRecord;
        if (rawDriver) {
          setDetailDriverRecord({
            id: rawDriver.id ?? null,
            driverId: rawDriver.driverId,
            driverName: rawDriver.driverName || res.data.driverName || "司机",
            attendanceDate: rawDriver.attendanceDate,
            attendanceType: rawDriver.attendanceType ?? 2,
            attendanceTypeText: rawDriver.attendanceTypeText || "全天",
            overtimeHours: rawDriver.overtimeHours ?? 0,
            dailyWage: rawDriver.dailyWage ?? 0,
            overtimeWage: rawDriver.overtimeWage ?? 0,
            totalWage: rawDriver.totalWage ?? 0,
            baseDailySalary: rawDriver.baseDailySalary ?? 0,
            overtimeHourlyRate: rawDriver.overtimeHourlyRate ?? 0,
            remark: rawDriver.remark || "",
          });
        } else {
          setDetailDriverRecord(null);
        }
        await fetchWorkTypes();
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
      const payload: any = {
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
      };
      if (detailDriverRecord?.id) {
        payload.driverRecord = {
          recordId: detailDriverRecord.id,
          overtimeHours: detailDriverRecord.overtimeHours,
          dailyWage: detailDriverRecord.dailyWage,
          remark: detailDriverRecord.remark,
        };
      }
      await reviewAttendanceBatch(detailBatch.id, payload);
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

  /** 司机工资重新计算（司机固定全天） */
  const recalcDriverWages = (record: BatchDriverRecord) => {
    const rate = Number(record.overtimeHourlyRate) || 0;
    const overtimeHours = Number(record.overtimeHours) || 0;
    const dailyWage = Number(record.dailyWage) || 0;
    const overtimeWage = Math.round(rate * overtimeHours * 100) / 100;
    const totalWage = Math.round((dailyWage + overtimeWage) * 100) / 100;
    return { dailyWage, overtimeWage, totalWage };
  };

  const handleReset = () => {
    const from = getWeekAgo();
    const to = getToday();
    setStatusFilter("0");
    setDateFrom(from);
    setDateTo(to);
    setLoading(true);
    getAttendanceBatchList({
      pageNum: 1,
      pageSize: 100,
      status: 0,
      dateFrom: from || undefined,
      dateTo: to || undefined,
    }).then((res) => {
      if (res.code === 200 && res.data?.records) {
        setBatches(res.data.records);
      }
    }).catch((err: any) => {
      toast.error(err?.response?.data?.message || "获取批次列表失败");
    }).finally(() => {
      setLoading(false);
    });
  };

  const filteredWorkers = workers.filter((w) => {
    if (workerKeyword && !w.name.includes(workerKeyword)) return false;
    if (workerGroupFilter && String(w.groupId) !== workerGroupFilter) return false;
    return true;
  });

  const statusBadge = (status: number) => {
    if (status === 0)
      return <Badge variant="outline" className="rounded-md text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/50 bg-orange-50 dark:bg-orange-950/30">待审核</Badge>;
    if (status === 1)
      return <Badge variant="outline" className="rounded-md text-green-600 dark:text-green-400 border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-950/30">已通过</Badge>;
    if (status === 2)
      return <Badge variant="outline" className="rounded-md text-muted-foreground border-border bg-muted/30">已撤回</Badge>;
    if (status === 3)
      return <Badge variant="outline" className="rounded-md text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30">不通过</Badge>;
    return <Badge variant="outline" className="rounded-md text-muted-foreground border-border bg-muted/30">未知</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">考勤审核</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="manage-mode"
              checked={manageMode}
              onCheckedChange={setManageMode}
            />
            <Label htmlFor="manage-mode" className="text-sm text-muted-foreground cursor-pointer">管理</Label>
          </div>
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
      </div>

      {/* 筛选 */}
      <Card className="border-0 shadow-sm rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">状态</Label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setStatusFilter(val);
                  setLoading(true);
                  getAttendanceBatchList({
                    pageNum: 1,
                    pageSize: 100,
                    status: val || undefined,
                    dateFrom: dateFrom || undefined,
                    dateTo: dateTo || undefined,
                  }).then((res) => {
                    if (res.code === 200 && res.data?.records) {
                      setBatches(res.data.records);
                    }
                  }).catch((err: any) => {
                    toast.error(err?.response?.data?.message || "获取批次列表失败");
                  }).finally(() => {
                    setLoading(false);
                  });
                }}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-28"
              >
                <option value="">全部</option>
                <option value="0">待审核</option>
                <option value="1">已通过</option>
                <option value="2">已撤回</option>
                <option value="3">不通过</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">开始日期</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 rounded-lg w-40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">结束日期</Label>
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
              <TableRow className="bg-background/50 hover:bg-background/50">
                <TableHead className="text-muted-foreground font-medium">审核司机</TableHead>
                <TableHead className="text-muted-foreground font-medium">考勤日期</TableHead>
                <TableHead className="text-muted-foreground font-medium">状态</TableHead>
                <TableHead className="text-muted-foreground font-medium">工人数</TableHead>
                <TableHead className="text-muted-foreground font-medium">提交时间</TableHead>
                <TableHead className="text-muted-foreground font-medium">备注</TableHead>
                <TableHead className="text-muted-foreground font-medium w-32">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-muted-foreground/70">
                    <ClipboardCheck className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                    暂无考勤批次
                  </TableCell>
                </TableRow>
              ) : (
                batches.map((batch) => (
                  <TableRow key={batch.id} className="hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors">
                    <TableCell className="font-medium text-foreground">{batch.driverName}</TableCell>
                    <TableCell className="text-muted-foreground">{batch.batchDate}</TableCell>
                    <TableCell>{statusBadge(batch.status)}</TableCell>
                    <TableCell className="text-muted-foreground">{batch.totalWorkers} 人</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{batch.submitTime}</TableCell>
                    <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">{batch.remark || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-lg text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 dark:bg-blue-950/30"
                          onClick={() => openDetail(batch)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          查看
                        </Button>
                        {manageMode && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-lg text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 dark:bg-red-950/30"
                            onClick={() => {
                              setBatchToAction(batch);
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
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
              <Plus className="w-5 h-5 text-green-600 dark:text-green-400" />
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
              <div className="max-h-48 overflow-y-auto rounded-xl border border-border p-2 space-y-1">
                {filteredWorkers.length === 0 ? (
                  <p className="text-sm text-muted-foreground/70 text-center py-2">暂无符合条件的工人</p>
                ) : (
                  filteredWorkers.map((w) => (
                    <label
                      key={w.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-950/30 cursor-pointer text-sm"
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
                        className="rounded border-border"
                      />
                      <span className="text-foreground/90">{w.name}</span>
                      <span className="text-xs text-muted-foreground/70">{w.groupName || "未分组"}</span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground/70">已选择 {selectedWorkers.length} 人</p>
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
              <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
              批次详情
            </DialogTitle>
            <DialogDescription>
              审核司机：{detailBatch?.driverName} · 考勤日期：{detailBatch?.batchDate} · 状态：{detailBatch?.statusText}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {detailBatch?.status === 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-border p-3 bg-background/50">
                <Building2 className="w-4 h-4 text-muted-foreground/70" />
                <span className="text-xs text-muted-foreground">批量修改项目：</span>
                <select
                  value=""
                  onChange={(e) => {
                    const pid = e.target.value ? Number(e.target.value) : null;
                    const pName = projectOptions.find((p) => p.id === pid)?.projectName || "";
                    setDetailRecords((prev) =>
                      prev.map((r) => ({
                        ...r,
                        projectId: pid,
                        projectName: pName,
                      }))
                    );
                  }}
                  className="h-8 rounded-lg border border-input bg-background px-2 text-xs flex-1"
                >
                  <option value="">请选择项目</option>
                  {projectOptions.map((p) => (
                    <option key={p.id} value={p.id}>{p.projectName}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 司机考勤卡片 */}
            {detailDriverRecord && (
              <div className="rounded-xl border border-yellow-200 dark:border-yellow-800/50 p-3 space-y-2 bg-yellow-50 dark:bg-yellow-950/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-yellow-200 dark:bg-yellow-800/60 flex items-center justify-center text-yellow-800 dark:text-yellow-200 text-xs font-bold">
                      司
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{detailDriverRecord.driverName}</p>
                      <p className="text-[10px] text-yellow-700 dark:text-yellow-300">司机考勤</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200">¥{detailDriverRecord.totalWage.toFixed(2)}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-yellow-700 dark:text-yellow-300">出勤</Label>
                    <p className="text-xs text-foreground/90">{detailDriverRecord.attendanceTypeText}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-yellow-700 dark:text-yellow-300">加班(小时)</Label>
                    {detailBatch?.status === 0 ? (
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={detailDriverRecord.overtimeHours}
                        onChange={(e) => {
                          const next = { ...detailDriverRecord, overtimeHours: Number(e.target.value) };
                          const wages = recalcDriverWages(next);
                          setDetailDriverRecord({
                            ...next,
                            dailyWage: wages.dailyWage,
                            overtimeWage: wages.overtimeWage,
                            totalWage: wages.totalWage,
                          });
                        }}
                        className="h-8 rounded-lg text-xs px-2"
                      />
                    ) : (
                      <p className="text-xs text-foreground/90">{detailDriverRecord.overtimeHours}h</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-yellow-700 dark:text-yellow-300">日薪(元)</Label>
                    {detailBatch?.status === 0 ? (
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={detailDriverRecord.dailyWage}
                        onChange={(e) => {
                          const next = { ...detailDriverRecord, dailyWage: Number(e.target.value) };
                          const wages = recalcDriverWages(next);
                          setDetailDriverRecord({
                            ...next,
                            ...wages,
                          });
                        }}
                        className="h-8 rounded-lg text-xs px-2"
                      />
                    ) : (
                      <p className="text-xs text-foreground/90">¥{detailDriverRecord.dailyWage}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-yellow-700 dark:text-yellow-300">加班工资(元)</Label>
                    <p className="text-xs text-foreground/90">¥{detailDriverRecord.overtimeWage}</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-[10px] text-yellow-700 dark:text-yellow-300">备注</Label>
                    {detailBatch?.status === 0 ? (
                      <Input
                        value={detailDriverRecord.remark || ""}
                        onChange={(e) =>
                          setDetailDriverRecord({ ...detailDriverRecord, remark: e.target.value })
                        }
                        className="h-8 rounded-lg text-xs px-2"
                        placeholder="选填"
                      />
                    ) : (
                      <p className="text-xs text-foreground/90">{detailDriverRecord.remark || "-"}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {detailRecords.map((record, idx) => {
              const isEditing = detailBatch?.status === 0;
              return (
                <div key={record.id} className="rounded-xl border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-700 dark:text-green-300 text-xs font-bold">
                        {record.workerName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{record.workerName}</p>
                        <p className="text-[10px] text-muted-foreground/70">{record.groupName || "未分组"}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-green-700 dark:text-green-300">¥{record.totalWage.toFixed(2)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground/70">出勤</Label>
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
                        <p className="text-xs text-foreground/90">{record.attendanceTypeText}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground/70">加班(小时)</Label>
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
                        <p className="text-xs text-foreground/90">{record.overtimeHours}h</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground/70">作业类型</Label>
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
                        <p className="text-xs text-foreground/90">{record.workTypeName || "-"}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground/70">项目</Label>
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
                        <p className="text-xs text-foreground/90">{record.projectName || "-"}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground/70">日薪(元)</Label>
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
                        <p className="text-xs text-foreground/90">¥{record.dailyWage}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground/70">加班工资(元)</Label>
                      <p className="text-xs text-foreground/90">¥{record.overtimeWage}</p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-[10px] text-muted-foreground/70">备注</Label>
                      {isEditing ? (
                        <Input
                          value={record.remark || ""}
                          onChange={(e) => {
                            const newRecords = [...detailRecords];
                            newRecords[idx].remark = e.target.value;
                            setDetailRecords(newRecords);
                          }}
                          className="h-8 rounded-lg text-xs px-2"
                          placeholder="选填"
                        />
                      ) : (
                        <p className="text-xs text-foreground/90">{record.remark || "-"}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>共 {detailRecords.length} 人{detailDriverRecord ? " · 司机1人" : ""}</span>
              <span>
                合计工资：¥{(
                  detailRecords.reduce((sum, r) => sum + (r.totalWage || 0), 0) +
                  (detailDriverRecord?.totalWage || 0)
                ).toFixed(2)}
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-lg" onClick={() => setDetailOpen(false)}>
              关闭
            </Button>
            {detailBatch?.status === 0 && (
              <>
                <Button
                  variant="outline"
                  className="rounded-lg border-red-300 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 dark:bg-red-950/30 hover:text-red-700 dark:hover:text-red-300 dark:text-red-300"
                  onClick={() => {
                    setBatchToAction(detailBatch);
                    setRejectConfirmOpen(true);
                  }}
                >
                  <ShieldAlert className="w-4 h-4 mr-1" />
                  不予通过
                </Button>
                <Button
                  className="rounded-lg bg-green-600 hover:bg-green-700"
                  onClick={handleReview}
                  disabled={reviewing}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {reviewing ? "审核中..." : "保存并审核通过"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 不予通过确认弹窗 */}
      <Dialog open={rejectConfirmOpen} onOpenChange={setRejectConfirmOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2 text-red-600 dark:text-red-400">
              <ShieldAlert className="w-5 h-5" />
              确认不予通过
            </DialogTitle>
            <DialogDescription>
              确定要将该批次设为<strong>不通过</strong>吗？此操作不可撤销。
              <br />
              审核司机：{batchToAction?.driverName} · 日期：{batchToAction?.batchDate}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-lg" onClick={() => setRejectConfirmOpen(false)}>
              取消
            </Button>
            <Button
              className="rounded-lg bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!batchToAction) return;
                try {
                  await rejectAttendanceBatch(batchToAction.id);
                  toast.success("已设为不通过");
                  setRejectConfirmOpen(false);
                  setDetailOpen(false);
                  fetchBatches();
                } catch (err: any) {
                  toast.error(err?.response?.data?.message || "操作失败");
                }
              }}
            >
              确认不予通过
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除批次确认弹窗 */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2 text-red-600 dark:text-red-400">
              <Trash2 className="w-5 h-5" />
              确认删除批次
            </DialogTitle>
            <DialogDescription>
              确定要删除该考勤批次吗？
              <br />
              <span className="text-green-600 dark:text-green-400">删除后工人考勤记录仍然保留，仅解除与该批次的关联。</span>
              <br />
              审核司机：{batchToAction?.driverName} · 日期：{batchToAction?.batchDate}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-lg" onClick={() => setDeleteConfirmOpen(false)}>
              取消
            </Button>
            <Button
              className="rounded-lg bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!batchToAction) return;
                try {
                  await deleteAttendanceBatch(batchToAction.id);
                  toast.success("删除成功");
                  setDeleteConfirmOpen(false);
                  fetchBatches();
                } catch (err: any) {
                  toast.error(err?.response?.data?.message || "删除失败");
                }
              }}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
