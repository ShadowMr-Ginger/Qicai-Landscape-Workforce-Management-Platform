"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getLedgers, exportLedgers } from "@/lib/api";
import { toast } from "sonner";
import { FileText, FileSpreadsheet, CalendarDays } from "lucide-react";

interface LedgerItem {
  id: number;
  serviceName: string;
  workerTypeText?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  remark?: string;
}

interface LedgerRecord {
  id: number;
  projectId: number;
  projectName: string;
  recordDate: string;
  totalAmount: number;
  items: LedgerItem[];
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
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  return Number(value).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatUnitPrice(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "0";
  const num = Number(value);
  if (Number.isInteger(num)) return String(num);
  return String(num).replace(/(\.[0-9]*?)0+$/, "$1").replace(/\.$/, "");
}

function buildContent(items: LedgerItem[]) {
  if (!items || items.length === 0) return "";
  return items
    .map((item) => {
      const typeText = item.workerTypeText?.trim();
      return `${item.serviceName}${typeText ? "·" + typeText : ""}·${item.quantity}人`;
    })
    .join("+");
}

function buildTurnover(record: LedgerRecord) {
  const items = record.items;
  if (!items || items.length === 0) return "";
  const expr = items.map((item) => `${item.quantity}×${formatUnitPrice(item.unitPrice)}`).join("+");
  return `${expr}=${formatMoney(record.totalAmount)}`;
}

function buildRemark(record: LedgerRecord) {
  const projectName = record.projectName || "";
  const firstRemark = record.items?.[0]?.remark?.trim();
  if (!firstRemark) return `${projectName}等`;
  return `${projectName}·${firstRemark}等`;
}

export default function LedgerExportPage() {
  const [startDate, setStartDate] = useState<string>(getMonthStart());
  const [endDate, setEndDate] = useState<string>(getChinaToday());
  const [records, setRecords] = useState<LedgerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!startDate || !endDate) {
      setRecords([]);
      return;
    }
    setLoading(true);
    getLedgers({ startDate, endDate, pageNum: 1, pageSize: 9999 })
      .then((res) => {
        if (res.code === 200 && res.data) {
          const list = (res.data.records || []) as LedgerRecord[];
          setRecords(list);
        }
      })
      .catch(() => toast.error("加载台账记录失败"))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const totalAmount = useMemo(
    () => records.reduce((sum, r) => sum + (r.totalAmount ?? 0), 0),
    [records]
  );

  const handleExport = async (format: "word" | "excel") => {
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
      const res = await exportLedgers({ startDate, endDate, format });
      const blob = new Blob([res.data], {
        type:
          format === "excel"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const ext = format === "excel" ? "xlsx" : "docx";
      const fileName = `${startDate.replace(/-/g, ".")}~${endDate.replace(/-/g, ".")} - 台账导出.${ext}`;
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
        <h2 className="text-xl font-bold text-foreground">台账导出</h2>
        <p className="text-sm text-muted-foreground">选择日期范围，预览并导出台账报表</p>
      </div>

      <Card className="border-0 shadow-sm rounded-xl">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              className="rounded-lg bg-green-600 hover:bg-green-700"
              onClick={() => handleExport("word")}
              disabled={exporting}
            >
              <FileText className="w-4 h-4 mr-1.5" />
              导出 Word
            </Button>
            <Button
              variant="outline"
              className="rounded-lg"
              onClick={() => handleExport("excel")}
              disabled={exporting}
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
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {startDate} ~ {endDate}
            </span>
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
            <div className="text-center py-12 text-muted-foreground">所选范围内暂无台账记录</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/60">
                    <th className="border px-3 py-2 text-center font-semibold w-28">日期</th>
                    <th className="border px-3 py-2 text-left font-semibold">营业内容</th>
                    <th className="border px-3 py-2 text-center font-semibold w-52">营业额</th>
                    <th className="border px-3 py-2 text-left font-semibold w-56">备注</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-muted/20">
                      <td className="border px-3 py-2 text-center align-middle">
                        {formatDate(record.recordDate)}
                      </td>
                      <td className="border px-3 py-2">{buildContent(record.items)}</td>
                      <td className="border px-3 py-2 text-center align-middle">
                        {buildTurnover(record)}
                      </td>
                      <td className="border px-3 py-2 text-muted-foreground">
                        {buildRemark(record)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/40 font-semibold">
                    <td className="border px-3 py-2 text-center">—</td>
                    <td className="border px-3 py-2">合计</td>
                    <td className="border px-3 py-2 text-center">¥{formatMoney(totalAmount)}</td>
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
