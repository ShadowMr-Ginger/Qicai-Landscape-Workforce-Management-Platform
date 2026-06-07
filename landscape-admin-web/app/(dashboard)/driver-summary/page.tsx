"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserCircle, CalendarDays, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarView } from "@/components/attendance/calendar-view";
import { getDriverList, getDriverCalendar, getDriverAttendanceDetail, getDriverWageSummary } from "@/lib/api";

interface DriverItem {
  id: number;
  realName: string;
}

interface WageStats {
  totalUnsettled: number;
  yearTotal: number;
  yearSettled: number;
  yearUnsettled: number;
  historicalUnsettled: number;
}

export default function DriverSummaryPage() {
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [wageStatsMap, setWageStatsMap] = useState<Record<number, WageStats>>({});

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
        const driverList = res.data.records;
        setDrivers(driverList);
        // 批量获取工资统计
        fetchWageStats(driverList.map((d: DriverItem) => d.id));
      }
    } catch {
      toast.error("获取司机列表失败");
    }
  };

  const fetchWageStats = async (driverIds: number[]) => {
    const statsMap: Record<number, WageStats> = {};
    await Promise.all(
      driverIds.map(async (id) => {
        try {
          const res = await getDriverWageSummary(id);
          if (res.code === 200 && res.data) {
            statsMap[id] = res.data;
          }
        } catch { /* ignore */ }
      })
    );
    setWageStatsMap(statsMap);
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const openCalendar = async (driver: DriverItem) => {
    setCalendarDriverId(driver.id);
    setCalendarDriverName(driver.realName);
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

  const formatMoney = (v: number) => `¥${(v || 0).toFixed(2)}`;

  const StatsGrid = ({ stats }: { stats?: WageStats }) => {
    if (!stats) return null;
    return (
      <div className="grid grid-cols-5 gap-2 text-center mt-2">
        <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg py-1.5">
          <p className="text-[10px] text-orange-500">总共未结清</p>
          <p className="text-xs font-semibold text-orange-700 dark:text-orange-300">{formatMoney(stats.totalUnsettled)}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg py-1.5">
          <p className="text-[10px] text-blue-500">本年度需结清</p>
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">{formatMoney(stats.yearTotal)}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-950/30 rounded-lg py-1.5">
          <p className="text-[10px] text-green-500">本年度已结清</p>
          <p className="text-xs font-semibold text-green-700 dark:text-green-300">{formatMoney(stats.yearSettled)}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-950/30 rounded-lg py-1.5">
          <p className="text-[10px] text-red-500">本年度未结清</p>
          <p className="text-xs font-semibold text-red-700 dark:text-red-300">{formatMoney(stats.yearUnsettled)}</p>
        </div>
        <div className="bg-muted/30 rounded-lg py-1.5">
          <p className="text-[10px] text-muted-foreground">历来未结清</p>
          <p className="text-xs font-semibold text-foreground/90">{formatMoney(stats.historicalUnsettled)}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">司机考勤信息汇总</h2>
        <Link href="/attendance-records">
          <Button variant="outline" size="sm" className="rounded-lg">
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {drivers.map((driver) => (
          <Card
            key={driver.id}
            className="border-0 shadow-sm rounded-xl cursor-pointer hover:shadow-md hover:bg-green-50 dark:hover:bg-green-950/20 transition-all"
            onClick={() => openCalendar(driver)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 dark:text-orange-300 text-sm font-bold">
                    <UserCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{driver.realName}</p>
                    <p className="text-xs text-muted-foreground/70">点击查看出勤日历</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 rounded-lg text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/30 dark:bg-green-950/30">
                  <CalendarDays className="w-4 h-4 mr-1" />
                  日历
                </Button>
              </div>
              <StatsGrid stats={wageStatsMap[driver.id]} />
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
                  <p className="text-muted-foreground/70 text-xs">总工资</p>
                  <p className="font-medium text-green-700 dark:text-green-300">¥{detail.totalWage}</p>
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
    </div>
  );
}
