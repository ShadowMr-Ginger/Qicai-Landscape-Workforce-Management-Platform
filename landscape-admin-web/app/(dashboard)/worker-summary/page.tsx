"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Users, ChevronDown, ChevronRight, CalendarDays, ArrowLeft } from "lucide-react";
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
import { getGroupList, getGroupWorkers, getWorkerCalendar, getWorkerAttendanceDetail, getWorkerWageSummary } from "@/lib/api";

interface GroupItem {
  id: number;
  groupName: string;
  workers: WorkerItem[];
}

interface WorkerItem {
  id: number;
  name: string;
  genderText: string;
  isEmployed: number;
}

interface WageStats {
  totalUnsettled: number;
  yearTotal: number;
  yearSettled: number;
  yearUnsettled: number;
  historicalUnsettled: number;
}

export default function WorkerSummaryPage() {
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [wageStatsMap, setWageStatsMap] = useState<Record<number, WageStats>>({});

  // 日历弹窗
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarWorkerId, setCalendarWorkerId] = useState<number | null>(null);
  const [calendarWorkerName, setCalendarWorkerName] = useState("");
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
  const [calendarDays, setCalendarDays] = useState<any[]>([]);
  const [calendarSummary, setCalendarSummary] = useState({ totalWage: 0, settledWage: 0, unsettledWage: 0 });

  // 详情弹窗
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await getGroupList();
      if (res.code === 200 && res.data) {
        const list: GroupItem[] = [];
        const allWorkerIds: number[] = [];
        for (const g of res.data) {
          try {
            const wRes = await getGroupWorkers(g.id);
            const workers = wRes.code === 200 && wRes.data ? wRes.data : [];
            list.push({ id: g.id, groupName: g.groupName, workers });
            workers.forEach((w: WorkerItem) => allWorkerIds.push(w.id));
          } catch {
            list.push({ id: g.id, groupName: g.groupName, workers: [] });
          }
        }
        setGroups(list);
        // 批量获取工资统计
        fetchWageStats(allWorkerIds);
      }
    } catch (err: any) {
      toast.error("获取数据失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchWageStats = async (workerIds: number[]) => {
    const statsMap: Record<number, WageStats> = {};
    await Promise.all(
      workerIds.map(async (id) => {
        try {
          const res = await getWorkerWageSummary(id);
          if (res.code === 200 && res.data) {
            statsMap[id] = res.data;
          }
        } catch { /* ignore */ }
      })
    );
    setWageStatsMap(statsMap);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const toggleGroup = (id: number) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCalendar = async (worker: WorkerItem) => {
    setCalendarWorkerId(worker.id);
    setCalendarWorkerName(worker.name);
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    setCalendarYear(y);
    setCalendarMonth(m);
    await loadCalendar(worker.id, y, m);
    setCalendarOpen(true);
  };

  const loadCalendar = async (workerId: number, year: number, month: number) => {
    try {
      const res = await getWorkerCalendar(workerId, year, month);
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
    if (calendarWorkerId) {
      loadCalendar(calendarWorkerId, year, month);
    }
  };

  const handleDayClick = async (recordId: number) => {
    try {
      const res = await getWorkerAttendanceDetail(recordId);
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
        <h2 className="text-lg font-semibold text-foreground">工人考勤信息汇总</h2>
        <Link href="/attendance-records">
          <Button variant="outline" size="sm" className="rounded-lg">
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {groups.map((group) => (
          <Card key={group.id} className="border-0 shadow-sm rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 bg-background/50 hover:bg-muted/30 transition-colors"
              onClick={() => toggleGroup(group.id)}
            >
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="font-semibold text-foreground">{group.groupName}</span>
                <span className="text-xs text-muted-foreground/70">{group.workers.length} 人</span>
              </div>
              {expandedGroups.has(group.id) ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground/70" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground/70" />
              )}
            </button>
            {expandedGroups.has(group.id) && (
              <CardContent className="p-0">
                {group.workers.length === 0 ? (
                  <p className="text-sm text-muted-foreground/70 text-center py-4">该组暂无工人</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {group.workers.map((worker) => (
                      <div
                        key={worker.id}
                        className="px-5 py-3 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
                      >
                        <div className="flex items-center justify-between cursor-pointer" onClick={() => openCalendar(worker)}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-700 dark:text-green-300 text-xs font-bold">
                              {worker.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {worker.name}
                                {worker.isEmployed === 0 && (
                                  <span className="text-orange-500 text-xs ml-1">（已离职）</span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground/70">{worker.genderText}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 rounded-lg text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/30 dark:bg-green-950/30">
                            <CalendarDays className="w-4 h-4 mr-1" />
                            查看日历
                          </Button>
                        </div>
                        <StatsGrid stats={wageStatsMap[worker.id]} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* 日历弹窗 */}
      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="rounded-2xl max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{calendarWorkerName} 的出勤日历</DialogTitle>
          </DialogHeader>
          <CalendarView
            year={calendarYear}
            month={calendarMonth}
            days={calendarDays}
            summary={calendarSummary}
            title={`${calendarWorkerName}`}
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
                <p className="text-muted-foreground/70 text-xs">考勤员（司机）</p>
                <p className="font-medium">{detail.driverName}</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-3">
                <p className="text-muted-foreground/70 text-xs">工地/项目</p>
                <p className="font-medium">{detail.projectName || "-"}</p>
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
