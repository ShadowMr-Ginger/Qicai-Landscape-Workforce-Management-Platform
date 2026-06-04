"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  RotateCcw,
  Eye,
  ClipboardList,
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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getDriverAttendanceRecords,
  getDriverAttendanceDetail,
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
}

export default function DriverRecordsPage() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [driverName, setDriverName] = useState("");
  const [isSettled, setIsSettled] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await getDriverAttendanceRecords({
        pageNum: 1,
        pageSize: 100,
        driverName: driverName || undefined,
        isSettled: isSettled || undefined,
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
  }, []);

  const handleReset = () => {
    setDriverName("");
    setIsSettled("");
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">司机考勤记录总表</h2>
      </div>

      <Card className="border-0 shadow-sm rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">司机姓名</Label>
              <Input value={driverName} onChange={(e) => setDriverName(e.target.value)} className="h-9 rounded-lg w-32" placeholder="姓名" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">结清状态</Label>
              <select value={isSettled} onChange={(e) => setIsSettled(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-24">
                <option value="">全部</option>
                <option value="0">未结清</option>
                <option value="1">已结清</option>
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

      <Card className="border-0 shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="text-gray-600 font-medium">司机</TableHead>
                <TableHead className="text-gray-600 font-medium">考勤日期</TableHead>
                <TableHead className="text-gray-600 font-medium">出勤类型</TableHead>
                <TableHead className="text-gray-600 font-medium">加班</TableHead>
                <TableHead className="text-gray-600 font-medium">当日工资</TableHead>
                <TableHead className="text-gray-600 font-medium">结清状态</TableHead>
                <TableHead className="text-gray-600 font-medium w-16">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-gray-400">
                    <ClipboardList className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    暂无考勤记录
                  </TableCell>
                </TableRow>
              ) : (
                records.map((rec) => (
                  <TableRow key={rec.id} className="hover:bg-green-50/30 transition-colors">
                    <TableCell className="font-medium text-gray-800">{rec.driverName}</TableCell>
                    <TableCell className="text-gray-600">{rec.attendanceDate}</TableCell>
                    <TableCell className="text-gray-600">{rec.attendanceTypeText}</TableCell>
                    <TableCell className="text-gray-600">{rec.overtimeHours}h</TableCell>
                    <TableCell className="text-gray-800 font-medium">¥{rec.totalWage}</TableCell>
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

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>考勤详情</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">司机</p>
                  <p className="font-medium">{detail.driverName}</p>
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
                <p className="text-gray-400 text-xs">工作类型</p>
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
