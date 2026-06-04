"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserCircle, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarView } from "@/components/attendance/calendar-view";
import { getDriverList, getDriverCalendar, getDriverAttendanceDetail } from "@/lib/api";

interface DriverItem {
  id: number;
  name: string;
}

export default function DriverSummaryPage() {
  const [drivers, setDrivers] = useState<DriverItem[]>([]);

  // 日历弹窗
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarDriverId, setCalendarDriverId] = useState<number | null>(null);
  const [calendarDriverName, setCalendarDriverName] = useState("");
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
  const [calendarDays, setCalendarDays] = useState<any[]>([]);
  const [calendarSummary, setCalendarSummary] = useState({ totalWage: 0, settledWage: 0, unsettledWage: 0 });

  // 详情弹窗
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);

  const fetchDrivers = async () => {
    try {
      const res = await getDriverList({ pageNum: 1, pageSize: 1000 });
      if (res.code === 200 && res.data?.records) {
        setDrivers(res.data.records);
      }
    } catch {
      toast.error("获取司机列表失败");
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const openCalendar = async (driver: DriverItem) => {
    setCalendarDriverId(driver.id);
    setCalendarDriverName(driver.name);
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    setCalendarYear(y);
    setCalendarMonth(m);
    await loadCalendar(driver.id, y, m);
    setCalendarOpen(true);
  };

  const loadCalendar = async (driverId: number, year: number, month: number) => {
    try {
      const res = await getDriverCalendar(driverId, year, month);
      if (res.code === 200 && res.data) {
        setCalendarDays(res.data.days || []);
        setCalendarSummary(res.data.summary || { totalWage: 0, settledWage: 0, unsettledWage: 0 });
      }
    } catch {
      toast.error("获取日历数据失败");
    }
  };

  const handleMonthChange = (year: number, month: number) => {
    setCalendarYear(year);
    setCalendarMonth(month);
    if (calendarDriverId) {
      loadCalendar(calendarDriverId, year, month);
    }
  };

  const handleDayClick = async (recordId: number) => {
    try {
      const res = await getDriverAttendanceDetail(recordId);
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
        <h2 className="text-lg font-semibold text-gray-800">司机考勤信息汇总</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drivers.map((driver) => (
          <Card
            key={driver.id}
            className="border-0 shadow-sm rounded-xl cursor-pointer hover:shadow-md hover:bg-green-50/20 transition-all"
            onClick={() => openCalendar(driver)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 text-sm font-bold">
                  <UserCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{driver.name}</p>
                  <p className="text-xs text-gray-400">点击查看出勤日历</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50">
                <CalendarDays className="w-4 h-4 mr-1" />
                日历
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 日历弹窗 */}
      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="rounded-2xl max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{calendarDriverName} 的出勤日历</DialogTitle>
          </DialogHeader>
          <CalendarView
            year={calendarYear}
            month={calendarMonth}
            days={calendarDays}
            summary={calendarSummary}
            title={`${calendarDriverName}`}
            onMonthChange={handleMonthChange}
            onDayClick={handleDayClick}
          />
        </DialogContent>
      </Dialog>

      {/* 详情弹窗 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>出勤详情</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
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
                  <p className="text-gray-400 text-xs">总工资</p>
                  <p className="font-medium text-green-700">¥{detail.totalWage}</p>
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
