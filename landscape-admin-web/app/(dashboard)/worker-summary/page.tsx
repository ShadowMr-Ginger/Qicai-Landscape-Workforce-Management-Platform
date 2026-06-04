"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Users, ChevronDown, ChevronRight, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarView } from "@/components/attendance/calendar-view";
import { getGroupList, getGroupWorkers, getWorkerCalendar, getWorkerAttendanceDetail } from "@/lib/api";

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

export default function WorkerSummaryPage() {
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

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
        for (const g of res.data) {
          try {
            const wRes = await getGroupWorkers(g.id);
            list.push({
              id: g.id,
              groupName: g.groupName,
              workers: wRes.code === 200 && wRes.data ? wRes.data : [],
            });
          } catch {
            list.push({ id: g.id, groupName: g.groupName, workers: [] });
          }
        }
        setGroups(list);
      }
    } catch (err: any) {
      toast.error("获取数据失败");
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">工人考勤信息汇总</h2>
      </div>

      <div className="space-y-3">
        {groups.map((group) => (
          <Card key={group.id} className="border-0 shadow-sm rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 bg-gray-50/50 hover:bg-gray-50 transition-colors"
              onClick={() => toggleGroup(group.id)}
            >
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-800">{group.groupName}</span>
                <span className="text-xs text-gray-400">{group.workers.length} 人</span>
              </div>
              {expandedGroups.has(group.id) ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {expandedGroups.has(group.id) && (
              <CardContent className="p-0">
                {group.workers.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">该组暂无工人</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {group.workers.map((worker) => (
                      <div
                        key={worker.id}
                        className="flex items-center justify-between px-5 py-3 hover:bg-green-50/20 transition-colors cursor-pointer"
                        onClick={() => openCalendar(worker)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                            {worker.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {worker.name}
                              {worker.isEmployed === 0 && (
                                <span className="text-orange-500 text-xs ml-1">（已离职）</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-400">{worker.genderText}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50">
                          <CalendarDays className="w-4 h-4 mr-1" />
                          查看日历
                        </Button>
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
                <p className="text-gray-400 text-xs">考勤员（司机）</p>
                <p className="font-medium">{detail.driverName}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs">工地/项目</p>
                <p className="font-medium">{detail.projectName || "-"}</p>
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
