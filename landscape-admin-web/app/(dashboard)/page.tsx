"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Users,
  UserCircle,
  ClipboardCheck,
  Clock,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Wallet,
  Building2,
  Settings,
  CalendarIcon,
  Pencil,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  getSystemConfig,
  updateSystemConfig,
  getAttendanceBatchList,
  getWorkerAttendanceRecords,
  getDriverAttendanceRecords,
  getWorkerList,
  getDriverList,
  getSystemLogs,
  getUnresolvedAnomalyCount,
} from "@/lib/api";

function getToday(): string {
  const now = new Date();
  const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return chinaTime.toISOString().split("T")[0];
}

const quickLinks = [
  { title: "工资结算", desc: "查看本月工资汇总", icon: Wallet, href: "/wages", color: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" },
  { title: "项目管理", desc: "管理工地项目", icon: Building2, href: "/projects", color: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" },
  { title: "系统设置", desc: "配置系统参数", icon: Settings, href: "/settings", color: "bg-muted text-foreground/90" },
  { title: "考勤审核", desc: "审核司机提交的考勤", icon: ClipboardCheck, href: "/batches", color: "bg-orange-100 text-orange-700 dark:text-orange-300" },
];

interface LogItem {
  id: number;
  userType: string;
  userName: string;
  action: string;
  targetType: string;
  detail: string;
  createTime: string;
}

const actionLabels: Record<string, string> = {
  LOGIN: "登录",
  LOGOUT: "退出",
  CREATE: "新增",
  UPDATE: "修改",
  DELETE: "删除",
  SETTLE: "结算",
  REVIEW: "审核",
  OTHER: "其他",
};

function formatLogAction(log: LogItem): string {
  const action = actionLabels[log.action] || log.action;
  const who = log.userName || (log.userType === "ADMIN" ? "管理员" : "司机");
  if (log.targetType) {
    return `${who} ${action}了 ${log.targetType}${log.detail ? "：" + log.detail : ""}`;
  }
  return `${who} ${action}${log.detail ? "：" + log.detail : ""}`;
}

function formatTimeAgo(timeStr: string): string {
  const date = new Date(timeStr.replace(" ", "T"));
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "刚刚";
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} 天前`;
  return timeStr;
}

/**
 * Dashboard 首页
 *
 * <p>管理后台的首页，展示关键统计数据、快捷入口和最近动态。</p>
 */
export default function DashboardPage() {
  const router = useRouter();
  const [startWorkDate, setStartWorkDate] = useState("");
  const [editingDate, setEditingDate] = useState(false);
  const [dateInput, setDateInput] = useState("");

  const [pendingBatches, setPendingBatches] = useState(0);
  const [workerAttToday, setWorkerAttToday] = useState(0);
  const [driverAttToday, setDriverAttToday] = useState(0);
  const [workerTotal, setWorkerTotal] = useState(0);
  const [driverTotal, setDriverTotal] = useState(0);
  const [unresolvedAnomalies, setUnresolvedAnomalies] = useState(0);
  const [recentLogs, setRecentLogs] = useState<LogItem[]>([]);

  useEffect(() => {
    getSystemConfig("start_work_date").then((res) => {
      if (res.code === 200 && res.data) {
        setStartWorkDate(res.data);
      }
    });

    const today = getToday();
    Promise.all([
      getAttendanceBatchList({ status: 0, pageNum: 1, pageSize: 1 }),
      getWorkerAttendanceRecords({ dateFrom: today, dateTo: today, pageNum: 1, pageSize: 1 }),
      getDriverAttendanceRecords({ dateFrom: today, dateTo: today, pageNum: 1, pageSize: 1 }),
      getWorkerList({ isEmployed: 1, pageNum: 1, pageSize: 1 }),
      getDriverList({ isActive: 1, pageNum: 1, pageSize: 1 }),
      getUnresolvedAnomalyCount(),
      getSystemLogs({ pageNum: 1, pageSize: 5 }),
    ]).then(([batchRes, workerAttRes, driverAttRes, workerRes, driverRes, anomalyRes, logRes]) => {
      setPendingBatches(batchRes.data?.total ?? 0);
      setWorkerAttToday(workerAttRes.data?.total ?? 0);
      setDriverAttToday(driverAttRes.data?.total ?? 0);
      setWorkerTotal(workerRes.data?.total ?? 0);
      setDriverTotal(driverRes.data?.total ?? 0);
      setUnresolvedAnomalies(anomalyRes.data?.count ?? 0);
      setRecentLogs(logRes.data?.records || []);
    }).catch(() => { /* ignore */ });
  }, []);

  const handleSaveDate = async () => {
    try {
      await updateSystemConfig("start_work_date", dateInput);
      setStartWorkDate(dateInput);
      setEditingDate(false);
      toast.success("开工日已更新");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "更新失败");
    }
  };

  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">欢迎回来，管理员</h1>
          <p className="text-sm text-muted-foreground mt-1">
            今天是 {new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-card border rounded-xl px-3 py-2 shadow-sm">
            <CalendarIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-muted-foreground">本年度开工日：</span>
            {editingDate ? (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="h-7 w-36 text-sm rounded-lg"
                />
                <Button size="sm" className="h-7 rounded-lg bg-green-600 hover:bg-green-700 text-xs px-2" onClick={handleSaveDate}>保存</Button>
                <Button size="sm" variant="outline" className="h-7 rounded-lg text-xs px-2" onClick={() => setEditingDate(false)}>取消</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{startWorkDate || "-"}</span>
                <button
                  onClick={() => { setDateInput(startWorkDate); setEditingDate(true); }}
                  className="text-muted-foreground/70 hover:text-green-600 dark:text-green-400"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          <Link href="/batches">
            <Button className="rounded-xl bg-green-600 hover:bg-green-700 shadow-md shadow-green-200 dark:shadow-green-900/30">
              去审核考勤
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* 1. 待审核批次 */}
        <Card
          className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push("/batches")}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">待审核批次</p>
                <p className="text-3xl font-bold text-foreground">{pendingBatches}</p>
                <p className="text-xs text-muted-foreground/70 mt-1">需要尽快处理</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. 今日考勤记录数 */}
        <Card className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm text-muted-foreground">今日考勤记录数</p>
              <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-teal-600" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div
                className="rounded-lg bg-teal-50/50 dark:bg-teal-950/20 p-2 cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors"
                onClick={() => router.push("/worker-records")}
              >
                <p className="text-[10px] text-teal-600 mb-0.5">工人</p>
                <p className="text-xl font-bold text-foreground">{workerAttToday}</p>
              </div>
              <div
                className="rounded-lg bg-teal-50/50 p-2 cursor-pointer hover:bg-teal-50 transition-colors"
                onClick={() => router.push("/driver-records")}
              >
                <p className="text-[10px] text-teal-600 mb-0.5">司机</p>
                <p className="text-xl font-bold text-foreground">{driverAttToday}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground/70 mt-2">已通过审核</p>
          </CardContent>
        </Card>

        {/* 3. 工人总数 */}
        <Card
          className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push("/workers")}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">工人总数</p>
                <p className="text-3xl font-bold text-foreground">{workerTotal}</p>
                <p className="text-xs text-muted-foreground/70 mt-1">在职工人</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. 司机总数 */}
        <Card
          className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push("/drivers")}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">司机总数</p>
                <p className="text-3xl font-bold text-foreground">{driverTotal}</p>
                <p className="text-xs text-muted-foreground/70 mt-1">在职司机</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                <UserCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. 未处理异常 */}
        <Card
          className={cn(
            "border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow cursor-pointer",
            unresolvedAnomalies > 0 && "ring-1 ring-red-200 dark:ring-red-900/50"
          )}
          onClick={() => router.push("/anomalies")}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">未处理异常</p>
                <p className={cn("text-3xl font-bold", unresolvedAnomalies > 0 ? "text-red-600 dark:text-red-400" : "text-foreground")}>
                  {unresolvedAnomalies}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {unresolvedAnomalies > 0 ? "需要人工复核" : "暂无异常"}
                </p>
              </div>
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center",
                unresolvedAnomalies > 0 ? "bg-red-50 dark:bg-red-950/30" : "bg-gray-50 dark:bg-gray-950/30"
              )}>
                <AlertTriangle className={cn("w-5 h-5", unresolvedAnomalies > 0 ? "text-red-600 dark:text-red-400" : "text-gray-500")} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 快捷入口 */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                快捷入口
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quickLinks.map((link) => (
                  <Link key={link.title} href={link.href}>
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-green-200 dark:hover:border-green-800/50 hover:bg-green-50 dark:hover:bg-green-950/30 transition-all group cursor-pointer">
                      <div className={`w-10 h-10 rounded-lg ${link.color} flex items-center justify-center shrink-0`}>
                        <link.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground group-hover:text-green-700 dark:hover:text-green-300 dark:text-green-300 transition-colors">
                          {link.title}
                        </p>
                        <p className="text-xs text-muted-foreground/70 truncate">{link.desc}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 最近动态 */}
        <div>
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                最近动态
              </CardTitle>
              <Link href="/system-logs" className="text-xs text-green-600 dark:text-green-400 hover:underline">
                查看全部
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentLogs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">暂无系统日志</p>
                )}
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground/90 leading-relaxed">{formatLogAction(log)}</p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">{formatTimeAgo(log.createTime)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 数据概览装饰卡片 */}
      <Card className="border-0 shadow-sm rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm mb-1">系统状态</p>
            <p className="text-xl font-bold">运行正常</p>
            <p className="text-green-100 text-xs mt-1">上次备份：今天 03:00</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
