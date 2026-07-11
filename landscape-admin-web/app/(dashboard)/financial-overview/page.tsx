"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getFinancialOverview } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Wallet,
  PiggyBank,
  Users,
  UserCircle,
  CalendarDays,
} from "lucide-react";

interface PeriodStats {
  revenue: number;
  payableWage: number;
  workerWage: number;
  driverWage: number;
  netProfit: number;
}

interface MonthlyStats extends PeriodStats {
  month: number;
}

interface FinancialOverviewData {
  today: PeriodStats;
  month: PeriodStats;
  year: PeriodStats;
  monthlyTrend: MonthlyStats[];
}

const periodMeta = [
  {
    key: "today" as const,
    label: "今日",
    sub: "按中国时间当天统计",
    gradient: "from-green-50 to-white dark:from-green-950/20 dark:to-card",
    accent: "green",
  },
  {
    key: "month" as const,
    label: "本月",
    sub: "按中国时间当月累计",
    gradient: "from-emerald-50 to-white dark:from-emerald-950/20 dark:to-card",
    accent: "emerald",
  },
  {
    key: "year" as const,
    label: "本年",
    sub: "按中国时间当年累计",
    gradient: "from-teal-50 to-white dark:from-teal-950/20 dark:to-card",
    accent: "teal",
  },
];

function formatMoney(value: number) {
  return `¥${(value ?? 0).toFixed(2)}`;
}

function profitMargin(revenue: number, netProfit: number) {
  if (!revenue || revenue <= 0) return "0.0";
  return ((netProfit / revenue) * 100).toFixed(1);
}

function accentText(accent: string) {
  const map: Record<string, string> = {
    green: "text-green-600 dark:text-green-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    teal: "text-teal-600 dark:text-teal-400",
  };
  return map[accent] ?? "text-primary";
}

function accentBg(accent: string) {
  const map: Record<string, string> = {
    green: "bg-green-100 dark:bg-green-900/40",
    emerald: "bg-emerald-100 dark:bg-emerald-900/40",
    teal: "bg-teal-100 dark:bg-teal-900/40",
  };
  return map[accent] ?? "bg-muted";
}

function WageCompositionBar({ worker, driver }: { worker: number; driver: number }) {
  const total = worker + driver;
  if (total <= 0) {
    return <div className="h-2 rounded-full bg-muted w-full" />;
  }
  const workerPct = (worker / total) * 100;
  return (
    <div className="h-2 rounded-full w-full bg-orange-100 dark:bg-orange-900/40 overflow-hidden flex">
      <div
        className="h-full bg-orange-500"
        style={{ width: `${workerPct}%` }}
      />
      <div className="h-full bg-amber-400 flex-1" />
    </div>
  );
}

function NetProfitMiniBar({ value, max }: { value: number; max: number }) {
  if (max <= 0) return <div className="h-1.5 rounded-full bg-muted w-16" />;
  const pct = Math.min(Math.abs(value) / max, 1) * 100;
  return (
    <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className={cn(
          "h-full rounded-full",
          value >= 0 ? "bg-green-500" : "bg-red-500"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function FinancialOverviewPage() {
  const [data, setData] = useState<FinancialOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFinancialOverview()
      .then((res) => {
        if (res.code === 200 && res.data) {
          setData(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const maxMonthlyRevenue =
    data?.monthlyTrend && data.monthlyTrend.length > 0
      ? Math.max(...data.monthlyTrend.map((m) => m.revenue))
      : 0;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">财务概览</h1>
          <p className="text-sm text-muted-foreground mt-1">
            按中国时间汇总营业额、待付工资与净利润
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="w-4 h-4" />
          {new Date().toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {periodMeta.map((p) => {
          const stats = data?.[p.key];
          return (
            <Card
              key={p.key}
              className={cn(
                "border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow bg-gradient-to-br",
                p.gradient
              )}
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className={cn("text-sm font-medium mb-0.5", accentText(p.accent))}>
                      {p.label}营业额
                    </p>
                    <p className="text-[10px] text-muted-foreground/70">{p.sub}</p>
                  </div>
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      accentBg(p.accent)
                    )}
                  >
                    <TrendingUp className={cn("w-5 h-5", accentText(p.accent))} />
                  </div>
                </div>

                {loading || !stats ? (
                  <Skeleton className="h-9 w-32" />
                ) : (
                  <p className="text-3xl font-bold text-foreground">
                    {formatMoney(stats.revenue)}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">待付工资</p>
                    {loading || !stats ? (
                      <Skeleton className="h-5 w-20" />
                    ) : (
                      <p className="text-sm font-semibold text-foreground">
                        {formatMoney(stats.payableWage)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">净利润</p>
                    {loading || !stats ? (
                      <Skeleton className="h-5 w-20" />
                    ) : (
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          stats.netProfit >= 0
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-red-600 dark:text-red-400"
                        )}
                      >
                        {formatMoney(stats.netProfit)}
                      </p>
                    )}
                  </div>
                </div>

                {stats && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>净利率 {profitMargin(stats.revenue, stats.netProfit)}%</span>
                      <span>工资构成</span>
                    </div>
                    <WageCompositionBar
                      worker={stats.workerWage}
                      driver={stats.driverWage}
                    />
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground/80">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-orange-500" />
                        工人 {formatMoney(stats.workerWage)}
                      </span>
                      <span className="flex items-center gap-1">
                        <UserCircle className="w-3 h-3 text-amber-500" />
                        司机 {formatMoney(stats.driverWage)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 月度收支趋势 */}
      <Card className="border-0 shadow-sm rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Wallet className="w-4 h-4 text-green-600 dark:text-green-400" />
            本年度月度收支趋势
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-20">月份</TableHead>
                    <TableHead>营业额</TableHead>
                    <TableHead>待付工资</TableHead>
                    <TableHead>净利润</TableHead>
                    <TableHead className="w-40 hidden sm:table-cell">营收对比</TableHead>
                    <TableHead className="w-24 hidden md:table-cell">净利率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.monthlyTrend?.map((item) => (
                    <TableRow key={item.month}>
                      <TableCell className="font-medium">{item.month} 月</TableCell>
                      <TableCell>{formatMoney(item.revenue)}</TableCell>
                      <TableCell>{formatMoney(item.payableWage)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "font-medium",
                              item.netProfit >= 0
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-red-600 dark:text-red-400"
                            )}
                          >
                            {formatMoney(item.netProfit)}
                          </span>
                          <NetProfitMiniBar value={item.netProfit} max={maxMonthlyRevenue} />
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-green-500"
                            style={{
                              width:
                                maxMonthlyRevenue > 0
                                  ? `${(item.revenue / maxMonthlyRevenue) * 100}%`
                                  : "0%",
                            }}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {profitMargin(item.revenue, item.netProfit)}%
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!data?.monthlyTrend || data.monthlyTrend.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 说明 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm rounded-2xl bg-gradient-to-br from-muted/40 to-card">
          <CardContent className="p-5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">营业额口径</p>
              <p className="text-xs text-muted-foreground mt-1">
                统计对应时间范围内所有台账记录的 total_amount 合计。
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm rounded-2xl bg-gradient-to-br from-muted/40 to-card">
          <CardContent className="p-5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
              <PiggyBank className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">待付工资口径</p>
              <p className="text-xs text-muted-foreground mt-1">
                统计对应时间范围内工人与司机考勤记录的 total_wage 合计。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
