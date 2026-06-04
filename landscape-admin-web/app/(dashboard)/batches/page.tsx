"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  CheckCircle,
  Plus,
  ClipboardCheck,
  RotateCcw,
  ArrowLeft,
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
  approveAttendanceBatch,
  getDriverList,
  getWorkerList,
  getGroupList,
  getWorkTypeList,
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

  // 批次级统一字段
  const [batchAttendanceType, setBatchAttendanceType] = useState("2");
  const [batchOvertimeHours, setBatchOvertimeHours] = useState("0");
  const [batchWorkTypeId, setBatchWorkTypeId] = useState("");
  const [workTypeOptions, setWorkTypeOptions] = useState<{ id: number; typeName: string }[]>([]);

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
    } catch {
      // ignore
    }
  };

  const fetchWorkers = async () => {
    try {
      const res = await getWorkerList({ pageNum: 1, pageSize: 1000, isEmployed: 1 });
      if (res.code === 200 && res.data?.records) {
        setWorkers(res.data.records);
      }
    } catch {
      // ignore
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await getGroupList();
      if (res.code === 200 && res.data) {
        setGroupOptions(res.data);
      }
    } catch {
      // ignore
    }
  };

  const fetchWorkTypes = async () => {
    try {
      const res = await getWorkTypeList();
      if (res.code === 200 && res.data) {
        setWorkTypeOptions(res.data);
      }
    } catch {
      // ignore
    }
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
        workers: selectedWorkers.map((wid) => ({
          workerId: wid,
        })),
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

  const handleApprove = async (id: number) => {
    try {
      await approveAttendanceBatch(id);
      toast.success("审核通过");
      fetchBatches();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "审核失败");
    }
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
                <TableHead className="text-gray-600 font-medium w-24">操作</TableHead>
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
                      {batch.status === 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleApprove(batch.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          通过
                        </Button>
                      )}
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
    </div>
  );
}
