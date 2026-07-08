"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Search,
  RotateCcw,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getLedgers,
  deleteLedger,
  getAllProjects,
} from "@/lib/api";
import LedgerDialog from "./ledger-dialog";

interface LedgerItem {
  id: number;
  serviceName: string;
  workerType: number | null;
  workerTypeText: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sortOrder: number;
}

interface LedgerRecord {
  id: number;
  projectId: number;
  projectName: string;
  recordDate: string;
  totalAmount: number;
  items: LedgerItem[];
}

function getToday(): string {
  const now = new Date();
  const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return chinaTime.toISOString().split("T")[0];
}

function getMonthAgo(): string {
  const now = new Date();
  const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  chinaTime.setMonth(chinaTime.getMonth() - 1);
  return chinaTime.toISOString().split("T")[0];
}

export default function LedgersPage() {
  const [records, setRecords] = useState<LedgerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<{ id: number; projectName: string }[]>([]);
  const [projectId, setProjectId] = useState("");
  const [dateFrom, setDateFrom] = useState(getMonthAgo());
  const [dateTo, setDateTo] = useState(getToday());

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<LedgerRecord | null>(null);

  useEffect(() => {
    fetchProjects();
    fetchRecords();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await getAllProjects();
      if (res.code === 200 && res.data) {
        setProjects(res.data);
      }
    } catch {
      // ignore
    }
  };

  const fetchRecords = async (
    currentPage = page,
    overrides: Partial<{
      projectId: string;
      dateFrom: string;
      dateTo: string;
    }> = {}
  ) => {
    const filterProjectId = overrides.projectId ?? projectId;
    const filterDateFrom = overrides.dateFrom ?? dateFrom;
    const filterDateTo = overrides.dateTo ?? dateTo;

    try {
      setLoading(true);
      const params: any = {
        pageNum: currentPage,
        pageSize,
      };
      if (filterProjectId) params.projectId = Number(filterProjectId);
      if (filterDateFrom) params.startDate = filterDateFrom;
      if (filterDateTo) params.endDate = filterDateTo;
      const res = await getLedgers(params);
      if (res.code === 200 && res.data) {
        setRecords(res.data.records || []);
        setTotal(res.data.total || 0);
      } else {
        toast.error(res.message || "加载失败");
      }
    } catch (err: any) {
      toast.error(err?.message || "加载台账失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchRecords(1);
  };

  const handleReset = () => {
    const resetDateFrom = getMonthAgo();
    const resetDateTo = getToday();
    setProjectId("");
    setDateFrom(resetDateFrom);
    setDateTo(resetDateTo);
    setPage(1);
    fetchRecords(1, {
      projectId: "",
      dateFrom: resetDateFrom,
      dateTo: resetDateTo,
    });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchRecords(newPage);
  };

  const openCreate = () => {
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (record: LedgerRecord) => {
    setEditingId(record.id);
    setDialogOpen(true);
  };

  const handleDelete = async (record: LedgerRecord) => {
    if (!confirm(`确定删除 ${record.recordDate} 的台账记录吗？`)) return;
    try {
      await deleteLedger(record.id);
      toast.success("删除成功");
      fetchRecords();
    } catch (err: any) {
      toast.error(err?.message || "删除失败");
    }
  };

  const openDetail = (record: LedgerRecord) => {
    setDetail(record);
    setDetailOpen(true);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">记录台账</h2>
        <Button
          className="rounded-lg bg-green-600 hover:bg-green-700"
          onClick={openCreate}
        >
          <Plus className="w-4 h-4 mr-1" />
          新增台账记录
        </Button>
      </div>

      {/* 筛选块 */}
      <Card className="rounded-2xl border-border/60">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <LabelWrap>开始日期</LabelWrap>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-lg w-40"
              />
            </div>
            <div className="space-y-1.5">
              <LabelWrap>结束日期</LabelWrap>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-lg w-40"
              />
            </div>
            <div className="space-y-1.5">
              <LabelWrap>项目</LabelWrap>
              <select
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm w-48"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">全部项目</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                className="rounded-lg"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                重置
              </Button>
              <Button
                className="rounded-lg bg-green-600 hover:bg-green-700"
                onClick={handleSearch}
                disabled={loading}
              >
                <Search className="w-4 h-4 mr-1" />
                查询
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 列表 */}
      <Card className="rounded-2xl border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-36">日期</TableHead>
                <TableHead>项目</TableHead>
                <TableHead className="w-28 text-center">用工记录数</TableHead>
                <TableHead className="w-32 text-right">总金额</TableHead>
                <TableHead className="w-40 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    暂无台账记录
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.recordDate}</TableCell>
                    <TableCell>{record.projectName}</TableCell>
                    <TableCell className="text-center">{record.items?.length || 0}</TableCell>
                    <TableCell className="text-right font-medium">
                      ¥{record.totalAmount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-lg"
                          onClick={() => openDetail(record)}
                          title="查看"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => openEdit(record)}
                          title="编辑"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(record)}
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 分页 */}
        {records.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              共 {total} 条，第 {page} / {totalPages} 页
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 新增/编辑对话框 */}
      <LedgerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => fetchRecords()}
        editingId={editingId}
        projects={projects}
      />

      {/* 详情弹窗 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg">
              台账明细 · {detail?.recordDate}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {(detail?.items || []).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-border p-3"
              >
                <div>
                  <div className="text-sm font-medium">{item.serviceName}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.workerType === null ? "" : `${item.workerTypeText} · `}
                    {item.quantity} × ¥{item.unitPrice.toFixed(2)}
                  </div>
                </div>
                <div className="text-sm font-bold">¥{item.totalPrice.toFixed(2)}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-end text-sm font-bold pt-2">
            合计：¥{detail?.totalAmount.toFixed(2)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LabelWrap({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-medium text-muted-foreground mb-1">{children}</div>;
}
