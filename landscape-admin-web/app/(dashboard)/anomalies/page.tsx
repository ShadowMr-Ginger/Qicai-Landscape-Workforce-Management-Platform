"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  AlertTriangle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  CheckCircle,
  Trash2,
  ExternalLink,
  Users,
  UserCircle,
  ScanLine,
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getAnomalyList,
  resolveAnomaly,
  deleteAnomaly,
  runGlobalAnomalyCheck,
} from "@/lib/api";
import { cn } from "@/lib/utils";

interface AnomalyItem {
  id: number;
  type: number;
  typeText: string;
  subType: number;
  subTypeText: string;
  status: number;
  statusText: string;
  title: string;
  description: string;
  relatedId: number;
  relatedId2: number;
  relatedDate: string;
  linkUrl: string;
  resolvedTime: string;
  resolvedByName: string;
  createTime: string;
}

const typeOptions = [
  { value: "", label: "全部类型" },
  { value: "1", label: "重名异常" },
  { value: "2", label: "重复考勤" },
  { value: "3", label: "超长加班" },
];

const subTypeOptions = [
  { value: "", label: "全部对象" },
  { value: "1", label: "工人" },
  { value: "2", label: "司机" },
];

const statusOptions = [
  { value: "", label: "全部状态" },
  { value: "0", label: "未处理" },
  { value: "1", label: "已处理" },
];

const typeColors: Record<number, string> = {
  1: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
  2: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
  3: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
};

const statusColors: Record<number, string> = {
  0: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
  1: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
};

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize] = useState(15);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);

  const [type, setType] = useState("");
  const [subType, setSubType] = useState("");
  const [status, setStatus] = useState("0"); // 默认显示未处理
  const [keyword, setKeyword] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyItem | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteAnomalyItem, setDeleteAnomalyItem] = useState<AnomalyItem | null>(null);
  const [deleteResolved, setDeleteResolved] = useState(false);
  const [checking, setChecking] = useState(false);

  const fetchAnomalies = async (page = pageNum) => {
    setLoading(true);
    try {
      const res = await getAnomalyList({
        pageNum: page,
        pageSize,
        type: type ? Number(type) : undefined,
        subType: subType ? Number(subType) : undefined,
        status: status ? Number(status) : undefined,
        keyword: keyword || undefined,
      });
      if (res.code === 200 && res.data) {
        setAnomalies(res.data.records || []);
        setTotal(res.data.total || 0);
        setPages(res.data.pages || 0);
        setPageNum(page);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "获取异常记录失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    fetchAnomalies(1);
  };

  const handleReset = () => {
    setType("");
    setSubType("");
    setStatus("0");
    setKeyword("");
    fetchAnomalies(1);
  };

  const handleResolve = async (item: AnomalyItem) => {
    try {
      await resolveAnomaly(item.id);
      toast.success("已标记为处理完成");
      fetchAnomalies(pageNum);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "操作失败");
    }
  };

  const openDelete = (item: AnomalyItem) => {
    setDeleteAnomalyItem(item);
    setDeleteResolved(item.status === 1);
    setDeleteOpen(true);
  };

  const handleGlobalCheck = async () => {
    setChecking(true);
    try {
      const res = await runGlobalAnomalyCheck();
      if (res.code === 200) {
        toast.success(`全局检测完成，发现 ${res.data?.affected ?? 0} 条异常`);
        fetchAnomalies(1);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "全局检测失败");
    } finally {
      setChecking(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteAnomalyItem) return;
    try {
      await deleteAnomaly(deleteAnomalyItem.id);
      toast.success("异常记录已删除");
      setDeleteOpen(false);
      fetchAnomalies(pageNum);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "删除失败");
    }
  };

  const openDetail = (item: AnomalyItem) => {
    setSelectedAnomaly(item);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-700 dark:text-red-300" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">异常记录</h2>
            <p className="text-sm text-muted-foreground">系统检测到的数据异常，需人工复核处理</p>
          </div>
        </div>
        <Button
          className="rounded-lg bg-red-600 hover:bg-red-700"
          onClick={handleGlobalCheck}
          disabled={checking}
        >
          <ScanLine className="w-4 h-4 mr-1" />
          {checking ? "检测中..." : "全局异常检测"}
        </Button>
      </div>

      {/* 筛选栏 */}
      <Card className="border-0 shadow-sm rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">异常类型</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-32"
              >
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">对象</Label>
              <select
                value={subType}
                onChange={(e) => setSubType(e.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-28"
              >
                {subTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">状态</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-28"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px] space-y-1.5">
              <Label className="text-xs text-muted-foreground">关键词</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input
                  placeholder="搜索标题或描述..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="h-9 pl-9"
                />
              </div>
            </div>

            <Button
              size="sm"
              onClick={handleSearch}
              className="bg-green-600 hover:bg-green-700 text-white h-9"
            >
              查询
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="text-muted-foreground h-9"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 异常表格 */}
      <Card className="border-0 shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-background/50 hover:bg-background/50">
                <TableHead className="text-xs font-semibold text-muted-foreground w-32">类型</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">标题</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground w-28">关联日期</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground w-20">状态</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground w-36">创建时间</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground w-32 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-muted rounded animate-pulse w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : anomalies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-muted-foreground/70">
                    <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                    暂无异常记录
                  </TableCell>
                </TableRow>
              ) : (
                anomalies.map((item) => (
                  <TableRow key={item.id} className="hover:bg-background/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={cn("text-[10px] font-medium border-0", typeColors[item.type] || "bg-muted")}
                        >
                          {item.typeText}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-medium border-border/60"
                        >
                          {item.subType === 1 ? (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" /> 工人
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <UserCircle className="w-3 h-3" /> 司机
                            </span>
                          )}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-md" title={item.description}>
                          {item.description || "-"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {item.relatedDate || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn("text-[10px] font-medium border-0", statusColors[item.status] || "bg-muted")}
                      >
                        {item.statusText}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {item.createTime
                        ? new Date(item.createTime).toLocaleString("zh-CN")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-lg text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                          onClick={() => openDetail(item)}
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {item.linkUrl && (
                          <Link href={item.linkUrl}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 rounded-lg text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/30"
                              title="前往处理"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}
                        {item.status === 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 rounded-lg text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/30"
                            onClick={() => handleResolve(item)}
                            title="标记已处理"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-lg text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => openDelete(item)}
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
        </CardContent>
      </Card>

      {/* 分页 */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            共 <span className="font-medium text-foreground/90">{total}</span> 条记录，
            第 <span className="font-medium text-foreground/90">{pageNum}</span> / {pages} 页
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAnomalies(pageNum - 1)}
              disabled={pageNum <= 1 || loading}
              className="text-muted-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAnomalies(pageNum + 1)}
              disabled={pageNum >= pages || loading}
              className="text-muted-foreground"
            >
              下一页
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 详情弹窗 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              异常详情
            </DialogTitle>
            <DialogDescription>查看异常记录的完整信息</DialogDescription>
          </DialogHeader>
          {selectedAnomaly && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={cn("text-[10px] font-medium border-0", typeColors[selectedAnomaly.type] || "bg-muted")}
                >
                  {selectedAnomaly.typeText}
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn("text-[10px] font-medium border-0", statusColors[selectedAnomaly.status] || "bg-muted")}
                >
                  {selectedAnomaly.statusText}
                </Badge>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">标题</Label>
                <p className="text-sm font-medium text-foreground">{selectedAnomaly.title}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">描述</Label>
                <p className="text-sm text-foreground/90">{selectedAnomaly.description || "-"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">对象</Label>
                  <p className="text-sm text-foreground/90">{selectedAnomaly.subTypeText}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">关联日期</Label>
                  <p className="text-sm text-foreground/90">{selectedAnomaly.relatedDate || "-"}</p>
                </div>
              </div>
              {selectedAnomaly.status === 1 && (
                <div>
                  <Label className="text-xs text-muted-foreground">处理信息</Label>
                  <p className="text-sm text-foreground/90">
                    {selectedAnomaly.resolvedByName || "管理员"} 于 {" "}
                    {selectedAnomaly.resolvedTime
                      ? new Date(selectedAnomaly.resolvedTime).toLocaleString("zh-CN")
                      : "-"} {" "}
                    处理完成
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setDetailOpen(false)}>
              关闭
            </Button>
            {selectedAnomaly?.status === 0 && (
              <Button
                className="rounded-lg bg-green-600 hover:bg-green-700"
                onClick={() => {
                  setDetailOpen(false);
                  handleResolve(selectedAnomaly);
                }}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                标记已处理
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2 text-red-600 dark:text-red-400">
              <Trash2 className="w-5 h-5" />
              删除异常记录
            </DialogTitle>
            <DialogDescription>
              确定要删除这条异常记录吗？删除后将无法恢复。
              <br />
              <strong>异常标题：</strong>{deleteAnomalyItem?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteResolved}
                onChange={(e) => setDeleteResolved(e.target.checked)}
                className="mt-0.5 rounded border-border"
              />
              <span className="text-sm text-foreground/90">该异常已处理结束</span>
            </label>
            {!deleteResolved && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                请确认异常已处理结束后再删除，避免遗漏问题。
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setDeleteOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              className="rounded-lg"
              onClick={handleDeleteConfirm}
              disabled={!deleteResolved}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
