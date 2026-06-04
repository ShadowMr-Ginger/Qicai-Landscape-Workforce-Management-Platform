"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  RotateCcw,
  Eye,
  ClipboardList,
  ArrowLeft,
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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getWorkerAttendanceRecords,
  getWorkerAttendanceDetail,
  getGroupList,
  getDriverList,
} from "@/lib/api";
import { cn } from "@/lib/utils";

interface RecordItem {
  id: number;
  workerName: string;
  genderText: string;
  isSkilledWorkerText: string;
  groupName: string;
  driverName: string;
  attendanceDate: string;
  attendanceTypeText: string;
  overtimeHours: number;
  totalWage: number;
  isSettledText: string;
  projectName: string;
  workTypeName: string;
}

export default function WorkerRecordsPage() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [groupOptions, setGroupOptions] = useState<{ id: number; groupName: string }[]>([]);
  const [driverOptions, setDriverOptions] = useState<{ id: number; name: string }[]>([]);

  const [workerName, setWorkerName] = useState("");
  const [gender, setGender] = useState("");
  const [isSkilled, setIsSkilled] = useState("");
  const [groupId, setGroupId] = useState("");
  const [isSettled, setIsSettled] = useState("");
  const [driverId, setDriverId] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await getWorkerAttendanceRecords({
        pageNum: 1,
        pageSize: 100,
        workerName: workerName || undefined,
        gender: gender || undefined,
        isSkilledWorker: isSkilled || undefined,
        groupId: groupId || undefined,
        isSettled: isSettled || undefined,
        driverId: driverId || undefined,
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
    getGroupList().then((res) => {
      if (res.code === 200 && res.data) setGroupOptions(res.data);
    });
    getDriverList({ pageNum: 1, pageSize: 1000 }).then((res) => {
      if (res.code === 200 && res.data?.records) setDriverOptions(res.data.records);
    });
  }, []);

  const handleReset = () => {
    setWorkerName("");
    setGender("");
    setIsSkilled("");
    setGroupId("");
    setIsSettled("");
    setDriverId("");
    fetchRecords();
  };

  const openDetail = async (id: number) => {
    try {
      const res = await getWorkerAttendanceDetail(id);
      if (res.code === 200 && res.data) {
        setDetail(res.data);
        setDetailOpen(true);
      }
    } catch {
      toast.error("获取详情失败");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">工人考勤记录总表</h2>
        <Link href="/attendance-records">
          <Button variant="outline" size="sm" className="rounded-lg">
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回
          </Button>
        </Link>
      </div>

      {/* 筛选 */}
      <Card className="border-0 shadow-sm rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">工人姓名</Label>
              <Input value={workerName} onChange={(e) => setWorkerName(e.target.value)} className="h-9 rounded-lg w-32" placeholder="姓名" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">性别</Label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-20">
                <option value="">全部</option>
                <option value="1">男</option>
                <option value="2">女</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">技术工</Label>
              <select value={isSkilled} onChange={(e) => setIsSkilled(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-24">
                <option value="">全部</option>
                <option value="1">是</option>
                <option value="0">否</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">组别</Label>
              <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-28">
                <option value="">全部</option>
                {groupOptions.map((g) => (
                  <option key={g.id} value={g.id}>{g.groupName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">结清状态</Label>
              <select value={isSettled} onChange={(e) => setIsSettled(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-24">
                <option value="">全部</option>
                <option value="0">未结清</option>
                <option value="1">已结清</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">审核司机</Label>
              <select value={driverId} onChange={(e) => setDriverId(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-28">
                <option value="">全部</option>
                {driverOptions.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
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

      {/* 表格 */}
      <Card className="border-0 shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="text-gray-600 font-medium">工人</TableHead>
                <TableHead className="text-gray-600 font-medium">性别</TableHead>
                <TableHead className="text-gray-600 font-medium">组别</TableHead>
                <TableHead className="text-gray-600 font-medium">考勤日期</TableHead>
                <TableHead className="text-gray-600 font-medium">出勤类型</TableHead>
                <TableHead className="text-gray-600 font-medium">加班</TableHead>
                <TableHead className="text-gray-600 font-medium">当日工资</TableHead>
                <TableHead className="text-gray-600 font-medium">审核司机</TableHead>
                <TableHead className="text-gray-600 font-medium">结清状态</TableHead>
                <TableHead className="text-gray-600 font-medium w-16">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-16 text-gray-400">
                    <ClipboardList className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    暂无考勤记录
                  </TableCell>
                </TableRow>
              ) : (
                records.map((rec) => (
                  <TableRow key={rec.id} className="hover:bg-green-50/30 transition-colors">
                    <TableCell className="font-medium text-gray-800">{rec.workerName}</TableCell>
                    <TableCell className="text-gray-600">{rec.genderText}</TableCell>
                    <TableCell className="text-gray-600">{rec.groupName || "-"}</TableCell>
                    <TableCell className="text-gray-600">{rec.attendanceDate}</TableCell>
                    <TableCell className="text-gray-600">{rec.attendanceTypeText}</TableCell>
                    <TableCell className="text-gray-600">{rec.overtimeHours}h</TableCell>
                    <TableCell className="text-gray-800 font-medium">¥{rec.totalWage}</TableCell>
                    <TableCell className="text-gray-600">{rec.driverName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("rounded-md text-xs", rec.isSettledText === "已结清" ? "text-blue-600 border-blue-200 bg-blue-50" : "text-green-600 border-green-200 bg-green-50")}>
                        {rec.isSettledText}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg" onClick={() => openDetail(rec.id)}>
                        <Eye className="w-4 h-4 text-gray-500" />
                      </Button>
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
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">工人</p>
                  <p className="font-medium">{detail.workerName}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">考勤日期</p>
                  <p className="font-medium">{detail.attendanceDate}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">出勤类型</p>
                  <p className="font-medium">{detail.attendanceTypeText}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">加班时长</p>
                  <p className="font-medium">{detail.overtimeHours}h</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">基础工资</p>
                  <p className="font-medium">¥{detail.dailyWage}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">加班工资</p>
                  <p className="font-medium">¥{detail.overtimeWage}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">总工资</p>
                  <p className="font-medium text-green-700">¥{detail.totalWage}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">结清状态</p>
                  <p className="font-medium">{detail.isSettledText}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs">审核司机</p>
                <p className="font-medium">{detail.driverName}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs">工地/项目</p>
                <p className="font-medium">{detail.projectName || "-"}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs">作业类型</p>
                <p className="font-medium">{detail.workTypeName || "-"}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs">备注</p>
                <p className="font-medium">{detail.remark || "-"}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
