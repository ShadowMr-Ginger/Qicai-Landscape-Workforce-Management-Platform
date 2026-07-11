"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getAllProjects,
  getProjectRevenueRecords,
  exportProjectRevenueRecords,
} from "@/lib/api";
import { toast } from "sonner";
import { FileText, FileSpreadsheet, CalendarDays, Building2 } from "lucide-react";

interface ProjectOption {
  id: number;
  projectName: string;
}

interface RevenueItem {
  id: number;
  serviceName: string;
  workerType: number;
  workerTypeText: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  remark: string;
}

interface RevenueRecord {
  id: number;
  projectId: number;
  recordDate: string;
  totalAmount: number;
  remark: string;
  createTime: string;
  items: RevenueItem[];
}

function getChinaToday(): string {
  const now = new Date();
  const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return chinaTime.toISOString().split("T")[0];
}

function getMonthStart(): string {
  const now = new Date();
  const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const start = new Date(Date.UTC(chinaTime.getUTCFullYear(), chinaTime.getUTCMonth(), 1, 8));
  return start.toISOString().split("T")[0];
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  const num = Number(value);
  return num.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CustomerReconciliationPage() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(getMonthStart());
  const [endDate, setEndDate] = useState<string>(getChinaToday());
  const [records, setRecords] = useState<RevenueRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const selectedProject = useMemo(
    () => projects.find((p) => String(p.id) === selectedProjectId),
    [projects, selectedProjectId]
  );

  useEffect(() => {
    getAllProjects()
      .then((res) => {
        if (res.code === 200 && res.data) {
          const list = res.data as ProjectOption[];
          setProjects(list);
          if (list.length > 0) {
            setSelectedProjectId(String(list[0].id));
          }
        }
      })
      .catch(() => toast.error("加载项目列表失败"));
  }, []);

  useEffect(() => {
    if (!selectedProjectId || !startDate || !endDate) {
      setRecords([]);
      return;
    }
    setLoading(true);
    getProjectRevenueRecords(Number(selectedProjectId), { startDate, endDate })
      .then((res) => {
        if (res.code === 200 && res.data) {
          setRecords(res.data as RevenueRecord[]);
        }
      })
      .catch(() => toast.error("加载营业记录失败"))
      .finally(() => setLoading(false));
  }, [selectedProjectId, startDate, endDate]);

  const totalAmount = useMemo(
    () =>
      records.reduce((sum, r) => {
        if (!r.items) return sum;
        return sum + r.items.reduce((s, i) => s + (i.totalPrice ?? 0), 0);
      }, 0),
    [records]
  );

  const handleExport = async (format: "word" | "excel") => {
    if (!selectedProject) {
      toast.error("请选择项目");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("请选择开始和结束日期");
      return;
    }
    if (startDate > endDate) {
      toast.error("开始日期不能晚于结束日期");
      return;
    }
    setExporting(true);
    try {
      const res = await exportProjectRevenueRecords(selectedProject.id, {
        startDate,
        endDate,
        format,
      });
      const blob = new Blob([res.data], {
        type:
          format === "excel"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const ext = format === "excel" ? "xlsx" : "docx";
      const fileName = `${startDate.replace(/-/g, ".")}~${endDate.replace(/-/g, ".")} - ${selectedProject.projectName} - 绿化用工.${ext}`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("导出成功");
    } catch (err: unknown) {
      toast.error("导出失败");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">客户对账表导出</h2>
        <p className="text-sm text-muted-foreground">选择项目与日期范围，预览并导出营业记录对账单</p>
      </div>

      <Card className="border-0 shadow-sm rounded-xl">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                开始日期
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                结束日期
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                项目
              </Label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {projects.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.projectName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              className="rounded-lg bg-green-600 hover:bg-green-700"
              onClick={() => handleExport("word")}
              disabled={exporting || !selectedProjectId}
            >
              <FileText className="w-4 h-4 mr-1.5" />
              导出 Word
            </Button>
            <Button
              variant="outline"
              className="rounded-lg"
              onClick={() => handleExport("excel")}
              disabled={exporting || !selectedProjectId}
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              导出 Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            报表预览
            {selectedProject && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {selectedProject.projectName}（{startDate} ~ {endDate}）
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">所选范围内暂无营业记录</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/60">
                    <th className="border px-3 py-2 text-center font-semibold w-28">日期</th>
                    <th className="border px-3 py-2 text-left font-semibold">服务名称</th>
                    <th className="border px-3 py-2 text-center font-semibold w-20">数量</th>
                    <th className="border px-3 py-2 text-right font-semibold w-24">单价</th>
                    <th className="border px-3 py-2 text-right font-semibold w-24">金额</th>
                    <th className="border px-3 py-2 text-left font-semibold w-40">备注</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) =>
                    record.items?.map((item, idx) => (
                      <tr key={`${record.id}-${item.id}`} className="hover:bg-muted/20">
                        {idx === 0 && (
                          <td
                            rowSpan={record.items.length}
                            className="border px-3 py-2 text-center align-middle"
                          >
                            {formatDate(record.recordDate)}
                          </td>
                        )}
                        <td className="border px-3 py-2">
                          {item.serviceName}
                          {item.workerTypeText && (
                            <span className="ml-2 text-xs text-muted-foreground">({item.workerTypeText})</span>
                          )}
                        </td>
                        <td className="border px-3 py-2 text-center">{item.quantity}</td>
                        <td className="border px-3 py-2 text-right">¥{formatMoney(item.unitPrice)}</td>
                        <td className="border px-3 py-2 text-right">¥{formatMoney(item.totalPrice)}</td>
                        <td className="border px-3 py-2 text-muted-foreground">{item.remark || ""}</td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-muted/40 font-semibold">
                    <td className="border px-3 py-2 text-center">—</td>
                    <td className="border px-3 py-2" colSpan={3}>
                      总计
                    </td>
                    <td className="border px-3 py-2 text-right">¥{formatMoney(totalAmount)}</td>
                    <td className="border px-3 py-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
