"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getAttendanceMonths, getDriverMonthlyReport } from "@/lib/api";
import { toast } from "sonner";
import type { MonthlyReportData } from "../types";
import { AttendanceTable } from "../attendance-table";

interface MonthOption {
  year: number;
  month: number;
  label: string;
}

export default function DriverMonthlyAttendancePage() {
  const router = useRouter();
  const [months, setMonths] = useState<MonthOption[]>([]);
  const [report, setReport] = useState<MonthlyReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedYearMonth, setSelectedYearMonth] = useState<string>("");

  const today = useMemo(() => new Date(), []);
  const currentYearMonth = useMemo(
    () => `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`,
    [today]
  );

  useEffect(() => {
    getAttendanceMonths()
      .then((res) => {
        if (res.code === 200 && res.data) {
          setMonths(res.data);
          if (res.data.length > 0) {
            const latest = res.data[0];
            setSelectedYearMonth(`${latest.year}-${String(latest.month).padStart(2, "0")}`);
          } else {
            setSelectedYearMonth(currentYearMonth);
          }
        }
      })
      .catch(() => toast.error("加载年月选项失败"));
  }, [currentYearMonth]);

  const selectedYear = useMemo(() => {
    if (!selectedYearMonth) return 0;
    return parseInt(selectedYearMonth.split("-")[0], 10);
  }, [selectedYearMonth]);

  const selectedMonth = useMemo(() => {
    if (!selectedYearMonth) return 0;
    return parseInt(selectedYearMonth.split("-")[1], 10);
  }, [selectedYearMonth]);

  useEffect(() => {
    if (!selectedYear || !selectedMonth) {
      setReport(null);
      return;
    }
    setLoading(true);
    getDriverMonthlyReport(selectedYear, selectedMonth)
      .then((res) => {
        if (res.code === 200) {
          setReport(res.data);
        }
      })
      .catch(() => toast.error("加载考勤表失败"))
      .finally(() => setLoading(false));
  }, [selectedYear, selectedMonth]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.push("/reports/monthly-attendance")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-foreground">司机考勤表</h2>
            <p className="text-sm text-muted-foreground">选择年月后导出考勤表</p>
          </div>
        </div>
        <Button onClick={handlePrint} disabled={!report || loading}>
          <Printer className="w-4 h-4 mr-2" />
          打印 / 导出 PDF
        </Button>
      </div>

      <Card className="border-0 shadow-sm rounded-xl print:hidden">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="grid gap-2 flex-1 max-w-xs">
            <Label htmlFor="year-month">年月</Label>
            <select
              id="year-month"
              value={selectedYearMonth}
              onChange={(e) => setSelectedYearMonth(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {months.length === 0 && (
                <option value={currentYearMonth}>{currentYearMonth.replace("-", "年")}月</option>
              )}
              {months.map((m) => (
                <option key={`${m.year}-${m.month}`} value={`${m.year}-${String(m.month).padStart(2, "0")}`}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-20 print:hidden">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          <span className="ml-2 text-muted-foreground">加载中...</span>
        </div>
      )}

      {!loading && report && (
        <AttendanceTable
          report={report}
          exportDate={today}
          type="driver"
        />
      )}

      {!loading && !report && selectedYearMonth && (
        <div className="text-center py-20 text-muted-foreground print:hidden">
          该月份没有司机考勤记录
        </div>
      )}
    </div>
  );
}
