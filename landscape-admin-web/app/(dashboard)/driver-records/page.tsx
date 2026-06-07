"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  RotateCcw,
  Eye,
  ClipboardList,
  ArrowLeft,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";
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
  getDriverAttendanceRecords,
  getDriverAttendanceDetail,
  updateDriverAttendanceRecord,
  deleteDriverAttendanceRecord,
  getDriverList,
  getWorkTypeList,
} from "@/lib/api";
import { cn } from "@/lib/utils";

interface RecordItem {
  id: number;
  driverName: string;
  attendanceDate: string;
  attendanceTypeText: string;
  overtimeHours: number;
  totalWage: number;
  isSettledText: string;
  workTypeName: string;
  remark: string;
}

interface DriverOption {
  id: number;
  realName: string;
  baseDailySalary: number;
  overtimeHourlyRate: number;
}

function getToday(): string {
  const now = new Date();
  const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return chinaTime.toISOString().split("T")[0];
}

function getWeekAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
}

export default function DriverRecordsPage() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [driverOptions, setDriverOptions] = useState<DriverOption[]>([]);
  const [workTypeOptions, setWorkTypeOptions] = useState<{ id: number; typeName: string }[]>([]);

  const [driverName, setDriverName] = useState("");
  const [isSettled, setIsSettled] = useState("");
  const [dateFrom, setDateFrom] = useState(getWeekAgo());
  const [dateTo, setDateTo] = useState(getToday());

  const [manageMode, setManageMode] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<RecordItem | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await getDriverAttendanceRecords({
        pageNum: 1,
        pageSize: 100,
        driverName: driverName || undefined,
        isSettled: isSettled || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      if (res.code === 200 && res.data?.records) {
        setRecords(res.data.records);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "获取记录失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    getDriverList({ pageNum: 1, pageSize: 1000 }).then((res) => {
      if (res.code === 200 && res.data?.records) setDriverOptions(res.data.records);
    });
    getWorkTypeList().then((res) => {
      if (res.code === 200 && res.data) setWorkTypeOptions(res.data);
    });
  }, []);

  const handleReset = () => {
    setDriverName("");
    setIsSettled("");
    setDateFrom(getWeekAgo());
    setDateTo(getToday());
    fetchRecords();
  };

  const openDetail = async (id: number) => {
    try {
      const res = await getDriverAttendanceDetail(id);
      if (res.code === 200 && res.data) {
        setDetail(res.data);
        setDetailOpen(true);
      }
    } catch {
      toast.error("获取详情失败");
    }
  };

  const openEdit = async (rec: RecordItem) => {
    try {
      const res = await getDriverAttendanceDetail(rec.id);
      if (res.code === 200 && res.data) {
        // 从司机列表中找到当前司机的 baseDailySalary 和 overtimeHourlyRate
        const driver = driverOptions.find((d) => d.id === res.data.driverId);
        setEditRecord({
          ...res.data,
          baseDailySalary: driver?.baseDailySalary || res.data.dailyWage || 0,
          overtimeHourlyRate: driver?.overtimeHourlyRate || 0,
        });
        setEditOpen(true);
      }
    } catch {
      toast.error("获取详情失败");
    }
  };

  const recalcWages = (record: any) => {
    const base = Number(record.baseDailySalary) || 0;
    const rate = Number(record.overtimeHourlyRate) || 0;
    const attendanceType = Number(record.attendanceType);
    const overtimeHours = Number(record.overtimeHours) || 0;
    const dailyWage = attendanceType === 1 ? Math.round((base / 2) * 100) / 100 : base;
    const overtimeWage = Math.round(rate * overtimeHours * 100) / 100;
    const totalWage = Math.round((dailyWage + overtimeWage) * 100) / 100;
    return { dailyWage, overtimeWage, totalWage };
  };

  const handleSaveEdit = async () => {
    if (!editRecord) return;
    setSaving(true);
    try {
      await updateDriverAttendanceRecord(editRecord.id, {
        driverId: editRecord.driverId,
        attendanceDate: editRecord.attendanceDate,
        attendanceType: editRecord.attendanceType,
        overtimeHours: editRecord.overtimeHours,
        dailyWage: editRecord.dailyWage,
        overtimeWage: editRecord.overtimeWage,
        workTypeId: editRecord.workTypeId,
        remark: editRecord.remark,
        isSettled: editRecord.isSettled,
      });
      toast.success("更新成功");
      setEditOpen(false);
      fetchRecords();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "更新失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;
    try {
      await deleteDriverAttendanceRecord(recordToDelete.id);
      toast.success("删除成功");
      setDeleteConfirmOpen(false);
      fetchRecords();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "删除失败");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">司机考勤记录总表</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="manage-mode"
              checked={manageMode}
              onCheckedChange={setManageMode}
            />
            <Label htmlFor="manage-mode" className="text-sm text-muted-foreground cursor-pointer">管理</Label>
          </div>
          <Link href="/attendance-records">
            <Button variant="outline" size="sm" className="rounded-lg">
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border-0 shadow-sm rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">司机姓名</Label>
              <Input value={driverName} onChange={(e) => setDriverName(e.target.value)} className="h-9 rounded-lg w-32" placeholder="姓名" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">结清状态</Label>
              <select value={isSettled} onChange={(e) => setIsSettled(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-24">
                <option value="">全部</option>
                <option value="0">未结清</option>
                <option value="1">已结清</option>
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
              <Button size="sm" className="rounded-lg h-9 bg-green-600 hover:bg-green-700" onClick={fetchRecords}>
                <Search className="w-3.5 h-3.5 mr-1" />
                查询
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-background/50 hover:bg-background/50">
                <TableHead className="text-muted-foreground font-medium">司机</TableHead>
                <TableHead className="text-muted-foreground font-medium">考勤日期</TableHead>
                <TableHead className="text-muted-foreground font-medium">出勤类型</TableHead>
                <TableHead className="text-muted-foreground font-medium">加班</TableHead>
                <TableHead className="text-muted-foreground font-medium">当日工资</TableHead>
                <TableHead className="text-muted-foreground font-medium">结清状态</TableHead>
                <TableHead className="text-muted-foreground font-medium max-w-[100px]">备注</TableHead>
                <TableHead className="text-muted-foreground font-medium w-24">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16 text-muted-foreground/70">
                    <ClipboardList className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                    暂无考勤记录
                  </TableCell>
                </TableRow>
              ) : (
                records.map((rec) => (
                  <TableRow key={rec.id} className="hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors">
                    <TableCell className="font-medium text-foreground">{rec.driverName}</TableCell>
                    <TableCell className="text-muted-foreground">{rec.attendanceDate}</TableCell>
                    <TableCell className="text-muted-foreground">{rec.attendanceTypeText}</TableCell>
                    <TableCell className="text-muted-foreground">{rec.overtimeHours}h</TableCell>
                    <TableCell className="text-foreground font-medium">¥{rec.totalWage}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("rounded-md text-xs", rec.isSettledText === "已结清" ? "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/30" : "text-green-600 dark:text-green-400 border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-950/30")}>
                        {rec.isSettledText}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs max-w-[100px] truncate">{rec.remark || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg" onClick={() => openDetail(rec.id)}>
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        {manageMode && (
                          <>
                            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 dark:bg-blue-950/30" onClick={() => openEdit(rec)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 dark:bg-red-950/30" onClick={() => { setRecordToDelete(rec); setDeleteConfirmOpen(true); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
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

      {/* 详情弹窗 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>考勤详情</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-xl p-3">
                  <p className="text-muted-foreground/70 text-xs">司机</p>
                  <p className="font-medium">{detail.driverName}</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3">
                  <p className="text-muted-foreground/70 text-xs">考勤日期</p>
                  <p className="font-medium">{detail.attendanceDate}</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3">
                  <p className="text-muted-foreground/70 text-xs">出勤类型</p>
                  <p className="font-medium">{detail.attendanceTypeText}</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3">
                  <p className="text-muted-foreground/70 text-xs">加班时长</p>
                  <p className="font-medium">{detail.overtimeHours}h</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3">
                  <p className="text-muted-foreground/70 text-xs">基础工资</p>
                  <p className="font-medium">¥{detail.dailyWage}</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3">
                  <p className="text-muted-foreground/70 text-xs">加班工资</p>
                  <p className="font-medium">¥{detail.overtimeWage}</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3">
                  <p className="text-muted-foreground/70 text-xs">总工资</p>
                  <p className="font-medium text-green-700 dark:text-green-300">¥{detail.totalWage}</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3">
                  <p className="text-muted-foreground/70 text-xs">结清状态</p>
                  <p className="font-medium">{detail.isSettledText}</p>
                </div>
              </div>
              <div className="bg-muted/30 rounded-xl p-3">
                <p className="text-muted-foreground/70 text-xs">作业类型</p>
                <p className="font-medium">{detail.workTypeName || "-"}</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-3">
                <p className="text-muted-foreground/70 text-xs">备注</p>
                <p className="font-medium">{detail.remark || "-"}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 编辑弹窗 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Pencil className="w-5 h-5 text-green-600 dark:text-green-400" />
              编辑考勤记录
            </DialogTitle>
            <DialogDescription>修改信息后点击保存，总工资将自动计算</DialogDescription>
          </DialogHeader>
          {editRecord && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">司机 <span className="text-red-500">*</span></Label>
                  <select
                    value={editRecord.driverId || ""}
                    onChange={(e) => {
                      const driverId = Number(e.target.value);
                      const driver = driverOptions.find((d) => d.id === driverId);
                      if (driver) {
                        const newRecord = { ...editRecord, driverId, baseDailySalary: driver.baseDailySalary, overtimeHourlyRate: driver.overtimeHourlyRate };
                        const wages = recalcWages(newRecord);
                        setEditRecord({ ...newRecord, ...wages });
                      }
                    }}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    {driverOptions.map((d) => (
                      <option key={d.id} value={d.id}>{d.realName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">考勤日期 <span className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    value={editRecord.attendanceDate}
                    onChange={(e) => setEditRecord({ ...editRecord, attendanceDate: e.target.value })}
                    className="h-9 rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">出勤类型 <span className="text-red-500">*</span></Label>
                  <select
                    value={editRecord.attendanceType || 2}
                    onChange={(e) => {
                      const newRecord = { ...editRecord, attendanceType: Number(e.target.value) };
                      const wages = recalcWages(newRecord);
                      setEditRecord({ ...newRecord, ...wages });
                    }}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value={2}>全天</option>
                    <option value={1}>半天</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">加班时长(小时)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={editRecord.overtimeHours}
                    onChange={(e) => {
                      const newRecord = { ...editRecord, overtimeHours: Number(e.target.value) };
                      const wages = recalcWages(newRecord);
                      setEditRecord({ ...newRecord, ...wages });
                    }}
                    className="h-9 rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">基础工资(元)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editRecord.dailyWage}
                    onChange={(e) => {
                      const dailyWage = Number(e.target.value) || 0;
                      const overtimeWage = editRecord.overtimeWage || 0;
                      setEditRecord({ ...editRecord, dailyWage, totalWage: Math.round((dailyWage + overtimeWage) * 100) / 100 });
                    }}
                    className="h-9 rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">加班工资(元)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editRecord.overtimeWage}
                    onChange={(e) => {
                      const overtimeWage = Number(e.target.value) || 0;
                      const dailyWage = editRecord.dailyWage || 0;
                      setEditRecord({ ...editRecord, overtimeWage, totalWage: Math.round((dailyWage + overtimeWage) * 100) / 100 });
                    }}
                    className="h-9 rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">总工资(元)</Label>
                  <Input
                    type="number"
                    value={editRecord.totalWage}
                    disabled
                    className="h-9 rounded-lg bg-muted/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">结清状态 <span className="text-red-500">*</span></Label>
                  <select
                    value={editRecord.isSettled ?? 0}
                    onChange={(e) => setEditRecord({ ...editRecord, isSettled: Number(e.target.value) })}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value={0}>未结清</option>
                    <option value={1}>已结清</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">作业类型</Label>
                  <select
                    value={editRecord.workTypeId || ""}
                    onChange={(e) => setEditRecord({ ...editRecord, workTypeId: e.target.value ? Number(e.target.value) : null })}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">请选择</option>
                    {workTypeOptions.map((wt) => (
                      <option key={wt.id} value={wt.id}>{wt.typeName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs text-muted-foreground">备注</Label>
                  <Input
                    value={editRecord.remark || ""}
                    onChange={(e) => setEditRecord({ ...editRecord, remark: e.target.value })}
                    className="h-9 rounded-lg"
                    placeholder="选填"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-lg" onClick={() => setEditOpen(false)}>取消</Button>
            <Button className="rounded-lg bg-green-600 hover:bg-green-700" onClick={handleSaveEdit} disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2 text-red-600 dark:text-red-400">
              <Trash2 className="w-5 h-5" />
              确认删除
            </DialogTitle>
            <DialogDescription>
              确定要删除该考勤记录吗？此操作不可撤销。
              <br />
              司机：{recordToDelete?.driverName} · 日期：{recordToDelete?.attendanceDate}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-lg" onClick={() => setDeleteConfirmOpen(false)}>取消</Button>
            <Button className="rounded-lg bg-red-600 hover:bg-red-700" onClick={handleDelete}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
