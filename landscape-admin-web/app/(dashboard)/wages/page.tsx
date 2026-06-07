"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Users,
  UserCircle,
  Search,
  CalendarDays,
  CheckCircle,
  ClipboardCheck,
  ArrowLeft,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { SettlementCalendar } from "@/components/attendance/settlement-calendar";
import {
  getGroupList,
  getGroupWorkers,
  getDriverList,
  getWorkerWageSummary,
  getDriverWageSummary,
  getWorkerCalendar,
  getDriverCalendar,
  previewWorkerSettle,
  previewDriverSettle,
  settleWorkerRecords,
  settleDriverRecords,
} from "@/lib/api";

interface WorkerItem {
  id: number;
  name: string;
  genderText: string;
  isEmployed: number;
}

interface GroupItem {
  id: number;
  groupName: string;
  workers: WorkerItem[];
}

interface DriverItem {
  id: number;
  realName: string;
  isActive: number;
}

interface WageStats {
  totalUnsettled: number;
}

interface CalendarDay {
  date: string;
  status: number;
  recordId?: number;
  totalWage?: number;
}

interface CalendarSummary {
  totalWage: number;
  settledWage: number;
  unsettledWage: number;
}

export default function WagesPage() {
  const [activeTab, setActiveTab] = useState<"workers" | "drivers">("workers");
  const [searchKeyword, setSearchKeyword] = useState("");

  // 工人数据
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [workerStatsMap, setWorkerStatsMap] = useState<Record<number, WageStats>>({});

  // 司机数据
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [driverStatsMap, setDriverStatsMap] = useState<Record<number, WageStats>>({});

  // 日历弹窗
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarPersonId, setCalendarPersonId] = useState<number | null>(null);
  const [calendarPersonName, setCalendarPersonName] = useState("");
  const [calendarIsWorker, setCalendarIsWorker] = useState(true);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [calendarSummary, setCalendarSummary] = useState<CalendarSummary>({ totalWage: 0, settledWage: 0, unsettledWage: 0 });
  const [minMonth, setMinMonth] = useState<string | undefined>(undefined);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<string | null>(null);

  // 结算确认弹窗
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [settling, setSettling] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  // 加载工人数据
  const fetchWorkers = async () => {
    try {
      const res = await getGroupList();
      if (res.code === 200 && res.data) {
        const list: GroupItem[] = [];
        const allIds: number[] = [];
        for (const g of res.data) {
          try {
            const wRes = await getGroupWorkers(g.id);
            const workers = (wRes.code === 200 && wRes.data ? wRes.data : [])
              .filter((w: WorkerItem) => w.isEmployed === 1);
            list.push({ id: g.id, groupName: g.groupName, workers });
            workers.forEach((w: WorkerItem) => allIds.push(w.id));
          } catch {
            list.push({ id: g.id, groupName: g.groupName, workers: [] });
          }
        }
        setGroups(list);
        fetchWorkerStats(allIds);
      }
    } catch {
      toast.error("获取工人数据失败");
    }
  };

  const fetchWorkerStats = async (ids: number[]) => {
    const map: Record<number, WageStats> = {};
    await Promise.all(
      ids.map(async (id) => {
        try {
          const res = await getWorkerWageSummary(id);
          if (res.code === 200 && res.data) {
            map[id] = { totalUnsettled: res.data.totalUnsettled };
          }
        } catch { /* ignore */ }
      })
    );
    setWorkerStatsMap(map);
  };

  // 加载司机数据
  const fetchDrivers = async () => {
    try {
      const res = await getDriverList({ pageNum: 1, pageSize: 1000 });
      if (res.code === 200 && res.data?.records) {
        const driverList = res.data.records.filter((d: DriverItem) => d.isActive === 1);
        setDrivers(driverList);
        fetchDriverStats(driverList.map((d: DriverItem) => d.id));
      }
    } catch {
      toast.error("获取司机数据失败");
    }
  };

  const fetchDriverStats = async (ids: number[]) => {
    const map: Record<number, WageStats> = {};
    await Promise.all(
      ids.map(async (id) => {
        try {
          const res = await getDriverWageSummary(id);
          if (res.code === 200 && res.data) {
            map[id] = { totalUnsettled: res.data.totalUnsettled };
          }
        } catch { /* ignore */ }
      })
    );
    setDriverStatsMap(map);
  };

  useEffect(() => {
    fetchWorkers();
    fetchDrivers();
  }, []);

  const toggleGroup = (id: number) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 加载日历数据
  const loadCalendar = async (personId: number, year: number, month: number, isWorker: boolean) => {
    try {
      const res = isWorker
        ? await getWorkerCalendar(personId, year, month)
        : await getDriverCalendar(personId, year, month);
      if (res.code === 200 && res.data) {
        setCalendarDays(res.data.days || []);
        setCalendarSummary(res.data.summary || { totalWage: 0, settledWage: 0, unsettledWage: 0 });
      }
    } catch {
      toast.error("获取日历数据失败");
    }
  };

  // 查找最早未结清月份
  const findEarliestUnsettledMonth = async (personId: number, isWorker: boolean): Promise<string | undefined> => {
    const currentYear = new Date().getFullYear();
    // 从当年1月开始往前查最多24个月
    for (let offset = 0; offset < 24; offset++) {
      const d = new Date(currentYear, new Date().getMonth() - offset, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      try {
        const res = isWorker
          ? await getWorkerCalendar(personId, y, m)
          : await getDriverCalendar(personId, y, m);
        if (res.code === 200 && res.data?.days) {
          const hasUnsettled = res.data.days.some((day: CalendarDay) => day.status === 1);
          if (hasUnsettled) {
            return `${y}-${String(m).padStart(2, "0")}`;
          }
        }
      } catch { /* ignore */ }
    }
    return undefined;
  };

  // 打开日历弹窗（结清部分）
  const openCalendar = async (person: WorkerItem | DriverItem, isWorker: boolean) => {
    const personId = person.id;
    const personName = isWorker ? (person as WorkerItem).name : (person as DriverItem).realName;
    setCalendarPersonId(personId);
    setCalendarPersonName(personName);
    setCalendarIsWorker(isWorker);
    setSelectedStart(null);
    setSelectedEnd(null);

    const earliestMonth = await findEarliestUnsettledMonth(personId, isWorker);
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    if (earliestMonth) {
      const [y, m] = earliestMonth.split("-").map(Number);
      setCalendarYear(y);
      setCalendarMonth(m);
      setMinMonth(earliestMonth);
      await loadCalendar(personId, y, m, isWorker);
    } else {
      setCalendarYear(now.getFullYear());
      setCalendarMonth(now.getMonth() + 1);
      setMinMonth(currentMonth);
      await loadCalendar(personId, now.getFullYear(), now.getMonth() + 1, isWorker);
    }
    setCalendarOpen(true);
  };

  const handleMonthChange = async (year: number, month: number) => {
    setCalendarYear(year);
    setCalendarMonth(month);
    if (calendarPersonId !== null) {
      await loadCalendar(calendarPersonId, year, month, calendarIsWorker);
    }
  };

  // 日历日期点击（范围选择）
  const handleDateSelect = (date: string) => {
    if (!selectedStart || (selectedStart && selectedEnd)) {
      // 第一次点击 或 第三次点击（重置）
      setSelectedStart(date);
      setSelectedEnd(null);
    } else if (selectedStart && !selectedEnd) {
      // 第二次点击
      if (date < selectedStart) {
        setSelectedEnd(selectedStart);
        setSelectedStart(date);
      } else {
        setSelectedEnd(date);
      }
    }
  };

  // 结清部分 - 确认选择后预览
  const handlePartialSettle = async () => {
    if (!selectedStart || !selectedEnd || !calendarPersonId) {
      toast.error("请选择结算日期范围");
      return;
    }
    setCalendarOpen(false);
    await doPreview(calendarPersonId, selectedStart, selectedEnd, calendarIsWorker);
  };

  // 结清全部
  const handleFullSettle = async (person: WorkerItem | DriverItem, isWorker: boolean) => {
    const personId = person.id;
    // 查询全部未结清记录范围
    const res = isWorker
      ? await previewWorkerSettle(personId, "2000-01-01", todayStr)
      : await previewDriverSettle(personId, "2000-01-01", todayStr);
    if (res.code === 200 && res.data && res.data.records && res.data.records.length > 0) {
      const earliest = res.data.records[0].attendanceDate;
      await doPreview(personId, earliest, todayStr, isWorker);
    } else {
      toast.info("该人员暂无未结清记录");
    }
  };

  // 预览结算
  const doPreview = async (personId: number, dateFrom: string, dateTo: string, isWorker: boolean) => {
    try {
      const res = isWorker
        ? await previewWorkerSettle(personId, dateFrom, dateTo)
        : await previewDriverSettle(personId, dateFrom, dateTo);
      if (res.code === 200 && res.data) {
        if (res.data.records.length === 0) {
          toast.info("所选时段内暂无未结清记录");
          return;
        }
        setPreviewData(res.data);
        setConfirmOpen(true);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "预览失败");
    }
  };

  // 执行结算
  const handleConfirmSettle = async () => {
    if (!previewData || !calendarPersonId) return;
    setSettling(true);
    try {
      const res = calendarIsWorker
        ? await settleWorkerRecords(calendarPersonId, { dateFrom: previewData.dateFrom, dateTo: previewData.dateTo })
        : await settleDriverRecords(calendarPersonId, { dateFrom: previewData.dateFrom, dateTo: previewData.dateTo });
      if (res.code === 200) {
        toast.success(`结算成功，共结算 ${previewData.records.length} 条记录`);
        setConfirmOpen(false);
        // 刷新数据
        if (calendarIsWorker) {
          const allIds = groups.flatMap((g) => g.workers.map((w) => w.id));
          fetchWorkerStats(allIds);
        } else {
          fetchDriverStats(drivers.map((d) => d.id));
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "结算失败");
    } finally {
      setSettling(false);
    }
  };

  const formatMoney = (v: number) => `¥${(v || 0).toFixed(2)}`;

  // 过滤工人
  const filteredGroups = groups.map((g) => ({
    ...g,
    workers: g.workers.filter((w) =>
      !searchKeyword || w.name.includes(searchKeyword)
    ),
  })).filter((g) => g.workers.length > 0);

  // 过滤司机
  const filteredDrivers = drivers.filter((d) =>
    !searchKeyword || d.realName.includes(searchKeyword)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">工资结算</h2>
        <Link href="/attendance-records">
          <Button variant="outline" size="sm" className="rounded-lg">
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回
          </Button>
        </Link>
      </div>

      {/* 选项卡 */}
      <div className="flex items-center gap-2 bg-muted/30 rounded-xl p-1 w-fit">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "workers"
              ? "bg-card text-green-700 dark:text-green-300 shadow-sm"
              : "text-muted-foreground hover:text-foreground/90"
          }`}
          onClick={() => { setActiveTab("workers"); setSearchKeyword(""); }}
        >
          <Users className="w-4 h-4 inline mr-1" />
          工人工资
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "drivers"
              ? "bg-card text-green-700 dark:text-green-300 shadow-sm"
              : "text-muted-foreground hover:text-foreground/90"
          }`}
          onClick={() => { setActiveTab("drivers"); setSearchKeyword(""); }}
        >
          <UserCircle className="w-4 h-4 inline mr-1" />
          司机工资
        </button>
      </div>

      {/* 搜索 */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
          <Input
            placeholder={activeTab === "workers" ? "搜索工人姓名" : "搜索司机姓名"}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-9 rounded-lg"
          />
        </div>
      </div>

      {/* 工人工资面板 */}
      {activeTab === "workers" && (
        <div className="space-y-3">
          {filteredGroups.length === 0 ? (
            <Card className="border-0 shadow-sm rounded-xl">
              <CardContent className="p-8 text-center text-muted-foreground/70">
                <Wallet className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                暂无符合条件的工人
              </CardContent>
            </Card>
          ) : (
            filteredGroups.map((group) => (
              <Card key={group.id} className="border-0 shadow-sm rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-3 bg-background/50 hover:bg-muted/30 transition-colors"
                  onClick={() => toggleGroup(group.id)}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-foreground">{group.groupName}</span>
                    <span className="text-xs text-muted-foreground/70">{group.workers.length} 人</span>
                  </div>
                  {expandedGroups.has(group.id) ? (
                    <ChevronDownIcon />
                  ) : (
                    <ChevronRightIcon />
                  )}
                </button>
                {expandedGroups.has(group.id) && (
                  <CardContent className="p-0">
                    <div className="divide-y divide-gray-50">
                      {group.workers.map((worker) => {
                        const stats = workerStatsMap[worker.id];
                        return (
                          <div
                            key={worker.id}
                            className="flex items-center justify-between px-5 py-3 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
                          >
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
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-muted-foreground/70">未结清</span>
                                  <span className={`text-sm font-bold ${(stats?.totalUnsettled || 0) > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                                    {formatMoney(stats?.totalUnsettled || 0)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-lg text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/30 dark:bg-blue-950/30"
                                onClick={() => openCalendar(worker, true)}
                              >
                                <CalendarDays className="w-3.5 h-3.5 mr-1" />
                                结清部分
                              </Button>
                              <Button
                                size="sm"
                                className="h-8 rounded-lg bg-green-600 hover:bg-green-700"
                                onClick={() => handleFullSettle(worker, true)}
                              >
                                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                结清全部
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* 司机工资面板 */}
      {activeTab === "drivers" && (
        <div className="space-y-3">
          {filteredDrivers.length === 0 ? (
            <Card className="border-0 shadow-sm rounded-xl">
              <CardContent className="p-8 text-center text-muted-foreground/70">
                <Wallet className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                暂无符合条件的司机
              </CardContent>
            </Card>
          ) : (
            filteredDrivers.map((driver) => {
              const stats = driverStatsMap[driver.id];
              return (
                <Card key={driver.id} className="border-0 shadow-sm rounded-xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-700 dark:text-orange-300 text-sm font-bold">
                        <UserCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{driver.realName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground/70">未结清</span>
                          <span className={`text-sm font-bold ${(stats?.totalUnsettled || 0) > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                            {formatMoney(stats?.totalUnsettled || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/30 dark:bg-blue-950/30"
                        onClick={() => openCalendar(driver, false)}
                      >
                        <CalendarDays className="w-3.5 h-3.5 mr-1" />
                        结清部分
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 rounded-lg bg-green-600 hover:bg-green-700"
                        onClick={() => handleFullSettle(driver, false)}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        结清全部
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* 日历弹窗（结清部分） */}
      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="rounded-2xl max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{calendarPersonName} - 选择结算日期范围</DialogTitle>
            <DialogDescription>
              点击日历上的日期选择起始和终止日期，第三次点击将重置
            </DialogDescription>
          </DialogHeader>
          <SettlementCalendar
            year={calendarYear}
            month={calendarMonth}
            days={calendarDays}
            summary={calendarSummary}
            title={`${calendarPersonName}`}
            onMonthChange={handleMonthChange}
            minMonth={minMonth}
            maxMonth={todayStr.slice(0, 7)}
            selectedStart={selectedStart}
            selectedEnd={selectedEnd}
            onDateSelect={handleDateSelect}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-lg" onClick={() => setCalendarOpen(false)}>
              取消
            </Button>
            <Button
              className="rounded-lg bg-green-600 hover:bg-green-700"
              disabled={!selectedStart || !selectedEnd}
              onClick={handlePartialSettle}
            >
              <ClipboardCheck className="w-4 h-4 mr-1" />
              确认选择并结算
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 结算确认弹窗 */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-600 dark:text-green-400" />
              结算确认
            </DialogTitle>
            <DialogDescription>
              请核对以下结算信息
            </DialogDescription>
          </DialogHeader>
          {previewData && (
            <div className="space-y-3 text-sm">
              <div className="bg-muted/30 rounded-xl p-3">
                <p className="text-muted-foreground/70 text-xs">结算时段</p>
                <p className="font-medium">{previewData.dateFrom} 至 {previewData.dateTo}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-xl p-3">
                  <p className="text-muted-foreground/70 text-xs">出勤天数</p>
                  <p className="font-medium">{previewData.attendanceDays} 天</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3">
                  <p className="text-muted-foreground/70 text-xs">总加班时长</p>
                  <p className="font-medium">{previewData.totalOvertimeHours} 小时</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3">
                  <p className="text-muted-foreground/70 text-xs">基础日薪</p>
                  <p className="font-medium">¥{previewData.baseDailySalary}</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3">
                  <p className="text-muted-foreground/70 text-xs">加班时薪</p>
                  <p className="font-medium">¥{previewData.overtimeHourlyRate}</p>
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-3">
                <p className="text-green-600 dark:text-green-400 text-xs">工资计算式</p>
                <p className="font-bold text-green-700 dark:text-green-300 text-lg">{previewData.formula}</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-3">
                <p className="text-muted-foreground/70 text-xs">结算记录数</p>
                <p className="font-medium">{previewData.records.length} 条</p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-lg" onClick={() => setConfirmOpen(false)}>
              取消
            </Button>
            <Button
              className="rounded-lg bg-green-600 hover:bg-green-700"
              onClick={handleConfirmSettle}
              disabled={settling}
            >
              {settling ? "结算中..." : "确认结算"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg className="w-5 h-5 text-muted-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-5 h-5 text-muted-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
