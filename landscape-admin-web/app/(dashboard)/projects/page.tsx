"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  Search,
  Calendar,
  RotateCcw,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getProjectList,
  createProject,
  updateProject,
  deleteProject,
  closeProject,
  reopenProject,
  getProjectCalendar,
} from "@/lib/api";

interface ProjectItem {
  id: number;
  projectName: string;
  projectAddress?: string;
  startDate?: string;
  endDate?: string;
  status: number;
  statusText?: string;
  maleDailyRevenue?: number;
  femaleDailyRevenue?: number;
  grossMargin?: number;
  totalRevenue?: number;
  profit?: number;
  netProfit?: number;
  isSystem?: number;
  isSystemText?: string;
  isClosed?: number;
  isClosedText?: string;
  closeTime?: string;
  createTime?: string;
}

interface CalendarDay {
  date: string;
  status: number;
  maleCount: number;
  femaleCount: number;
  revenue: number;
  profit: number;
  payableWage: number;
  netProfit: number;
}

interface CalendarSummary {
  totalRevenue: number;
  totalProfit: number;
  totalPayableWage: number;
  totalNetProfit: number;
}

const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [manageMode, setManageMode] = useState(false);

  // 弹窗状态
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [createForm, setCreateForm] = useState({
    projectName: "",
    projectAddress: "",
    maleDailyRevenue: "",
    femaleDailyRevenue: "",
    grossMargin: "",
    startDate: "",
    endDate: "",
  });

  const [editForm, setEditForm] = useState({
    projectName: "",
    projectAddress: "",
    maleDailyRevenue: "",
    femaleDailyRevenue: "",
    grossMargin: "",
    startDate: "",
    endDate: "",
  });

  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  // 结项/重启确认弹窗
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"close" | "reopen" | null>(null);

  // 日历状态
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1);
  const [calDays, setCalDays] = useState<CalendarDay[]>([]);
  const [calSummary, setCalSummary] = useState<CalendarSummary>({
    totalRevenue: 0,
    totalProfit: 0,
    totalPayableWage: 0,
    totalNetProfit: 0,
  });

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await getProjectList({
        pageNum: 1,
        pageSize: 100,
        keyword: keyword || undefined,
      });
      if (res.code === 200 && res.data?.records) {
        setProjects(res.data.records);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "获取项目列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // ===== 新增 =====
  const handleCreate = async () => {
    if (!createForm.projectName.trim()) {
      toast.error("项目标题不能为空");
      return;
    }
    if (!createForm.maleDailyRevenue || Number(createForm.maleDailyRevenue) < 0) {
      toast.error("男工一日营业额不能为空");
      return;
    }
    if (!createForm.femaleDailyRevenue || Number(createForm.femaleDailyRevenue) < 0) {
      toast.error("女工一日营业额不能为空");
      return;
    }
    const gm = Number(createForm.grossMargin);
    if (isNaN(gm) || gm < 0 || gm > 1) {
      toast.error("毛利率需在 0~1 之间");
      return;
    }
    try {
      await createProject({
        projectName: createForm.projectName.trim(),
        projectAddress: createForm.projectAddress || undefined,
        maleDailyRevenue: Number(createForm.maleDailyRevenue),
        femaleDailyRevenue: Number(createForm.femaleDailyRevenue),
        grossMargin: gm,
        startDate: createForm.startDate || undefined,
        endDate: createForm.endDate || undefined,
      });
      toast.success("新增项目成功");
      setCreateOpen(false);
      setCreateForm({ projectName: "", projectAddress: "", maleDailyRevenue: "", femaleDailyRevenue: "", grossMargin: "", startDate: "", endDate: "" });
      fetchProjects();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "新增失败");
    }
  };

  // ===== 编辑 =====
  const openEdit = (item: ProjectItem) => {
    setSelectedProject(item);
    setEditForm({
      projectName: item.projectName || "",
      projectAddress: item.projectAddress || "",
      maleDailyRevenue: item.maleDailyRevenue != null ? String(item.maleDailyRevenue) : "",
      femaleDailyRevenue: item.femaleDailyRevenue != null ? String(item.femaleDailyRevenue) : "",
      grossMargin: item.grossMargin != null ? String(item.grossMargin) : "",
      startDate: item.startDate || "",
      endDate: item.endDate || "",
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedProject) return;
    if (!editForm.projectName.trim()) {
      toast.error("项目标题不能为空");
      return;
    }
    const gm = editForm.grossMargin !== "" ? Number(editForm.grossMargin) : undefined;
    if (gm !== undefined && (gm < 0 || gm > 1)) {
      toast.error("毛利率需在 0~1 之间");
      return;
    }
    try {
      const data: Record<string, unknown> = {
        projectName: editForm.projectName.trim(),
      };
      if (editForm.projectAddress !== undefined) data.projectAddress = editForm.projectAddress || undefined;
      if (editForm.maleDailyRevenue !== "") data.maleDailyRevenue = Number(editForm.maleDailyRevenue);
      if (editForm.femaleDailyRevenue !== "") data.femaleDailyRevenue = Number(editForm.femaleDailyRevenue);
      if (gm !== undefined) data.grossMargin = gm;
      if (editForm.startDate) data.startDate = editForm.startDate;
      if (editForm.endDate) data.endDate = editForm.endDate;

      await updateProject(selectedProject.id, data);
      toast.success("修改成功");
      setEditOpen(false);
      fetchProjects();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "修改失败");
    }
  };

  const openCloseConfirm = (item: ProjectItem) => {
    setSelectedProject(item);
    setConfirmAction("close");
    setConfirmOpen(true);
  };

  const openReopenConfirm = (item: ProjectItem) => {
    setSelectedProject(item);
    setConfirmAction("reopen");
    setConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedProject || !confirmAction) return;
    try {
      if (confirmAction === "close") {
        await closeProject(selectedProject.id);
        toast.success("结项成功");
      } else {
        await reopenProject(selectedProject.id);
        toast.success("重启成功");
      }
      setConfirmOpen(false);
      fetchProjects();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "操作失败");
    }
  };

  // ===== 删除 =====
  const handleDelete = async (item: ProjectItem) => {
    if (item.isSystem === 1) {
      toast.error("系统项目不可删除");
      return;
    }
    if (!confirm(`确定删除项目「${item.projectName}」吗？\n删除后该项目下的考勤记录将迁移到默认项目。`)) return;
    try {
      await deleteProject(item.id);
      toast.success("删除成功");
      fetchProjects();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "删除失败");
    }
  };

  // ===== 日历 =====
  const openCalendar = async (item: ProjectItem) => {
    setSelectedProject(item);
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    setCalYear(y);
    setCalMonth(m);
    setCalendarOpen(true);
    await loadCalendar(item.id, y, m);
  };

  const loadCalendar = async (projectId: number, year: number, month: number) => {
    try {
      const res = await getProjectCalendar(projectId, year, month);
      if (res.code === 200 && res.data) {
        setCalDays(res.data.days || []);
        setCalSummary(res.data.summary || { totalRevenue: 0, totalProfit: 0, totalPayableWage: 0, totalNetProfit: 0 });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "获取日历失败");
    }
  };

  const handleCalPrev = () => {
    let y = calYear;
    let m = calMonth;
    if (m === 1) { y--; m = 12; } else { m--; }
    setCalYear(y);
    setCalMonth(m);
    if (selectedProject) loadCalendar(selectedProject.id, y, m);
  };

  const handleCalNext = () => {
    const today = new Date();
    const currentYM = today.getFullYear() * 12 + today.getMonth();
    const viewYM = calYear * 12 + calMonth - 1;
    if (viewYM >= currentYM) return;
    let y = calYear;
    let m = calMonth;
    if (m === 12) { y++; m = 1; } else { m++; }
    setCalYear(y);
    setCalMonth(m);
    if (selectedProject) loadCalendar(selectedProject.id, y, m);
  };

  // 日历网格计算
  const calendarDays = (() => {
    const firstDay = new Date(calYear, calMonth - 1, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(calYear, calMonth, 0).getDate();
    const result: (CalendarDay | null)[] = [];
    for (let i = 0; i < startWeekday; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calYear}-${String(calMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const day = calDays.find((dd) => dd.date === dateStr);
      result.push(day || { date: dateStr, status: 0, maleCount: 0, femaleCount: 0, revenue: 0, profit: 0, payableWage: 0, netProfit: 0 });
    }
    return result;
  })();

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h2 className="text-lg font-semibold text-foreground">项目管理</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={manageMode ? "default" : "outline"}
            size="sm"
            className={`rounded-lg ${manageMode ? "bg-amber-600 hover:bg-amber-700" : ""}`}
            onClick={() => setManageMode(!manageMode)}
          >
            <Settings2 className="w-4 h-4 mr-1" />
            {manageMode ? "退出管理" : "管理"}
          </Button>
          {manageMode && (
            <Button
              variant="default"
              size="sm"
              className="rounded-lg bg-green-600 hover:bg-green-700"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              新增项目
            </Button>
          )}
        </div>
      </div>

      {/* 搜索 */}
      <Card className="border-0 shadow-sm rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
              <Input
                placeholder="搜索项目标题"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="rounded-lg pl-9 h-9 text-sm"
                onKeyDown={(e) => e.key === "Enter" && fetchProjects()}
              />
            </div>
            <Button size="sm" className="rounded-lg h-9 bg-green-600 hover:bg-green-700" onClick={fetchProjects}>
              查询
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 列表 */}
      <Card className="border-0 shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="divide-y divide-gray-50">
            {projects.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground/70 text-sm">暂无项目</p>
            ) : (
              projects.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-700 dark:text-green-300 text-sm font-bold shrink-0">
                      {item.projectName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground truncate">{item.projectName}</p>
                        {item.isSystem === 1 && (
                          <Badge variant="outline" className="rounded-md text-[10px] border-amber-200 dark:border-amber-800/50 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30">
                            系统
                          </Badge>
                        )}
                        <Badge variant="outline" className={`rounded-md text-[10px] ${
                          item.status === 1
                            ? "border-green-200 dark:border-green-800/50 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30"
                            : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30"
                        }`}>
                          {item.statusText || (item.status === 1 ? "进行中" : "已结项")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground/70 mt-1 flex-wrap">
                        <span>男:{item.maleDailyRevenue?.toFixed(2) ?? "0.00"}元/天</span>
                        <span>女:{item.femaleDailyRevenue?.toFixed(2) ?? "0.00"}元/天</span>
                        <span>毛利率:{((item.grossMargin ?? 0) * 100).toFixed(0)}%</span>
                        {item.projectAddress && <span className="truncate max-w-[200px]">{item.projectAddress}</span>}
                      </div>
                      {/* 净利润显著展示 */}
                      <div className="mt-2">
                        <span className={`text-sm font-bold ${(item.netProfit ?? 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                          净利润 ¥{item.netProfit?.toFixed(2) ?? "0.00"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {/* 日历按钮始终可见 */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 rounded-lg text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                      onClick={() => openCalendar(item)}
                      title="日历"
                    >
                      <Calendar className="w-4 h-4" />
                    </Button>

                    {manageMode && item.isSystem !== 1 && item.status === 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-lg text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                        onClick={() => openCloseConfirm(item)}
                        title="结项"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    )}

                    {manageMode && item.isSystem !== 1 && item.status !== 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-lg text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/30"
                        onClick={() => openReopenConfirm(item)}
                        title="重启"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    )}

                    {manageMode && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-lg text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                        onClick={() => openEdit(item)}
                        title="编辑"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}

                    {manageMode && item.isSystem !== 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-lg text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => handleDelete(item)}
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* ===== 新增弹窗 ===== */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">新增项目</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>项目标题 <span className="text-red-500">*</span></Label>
              <Input
                value={createForm.projectName}
                onChange={(e) => setCreateForm({ ...createForm, projectName: e.target.value })}
                className="rounded-lg"
                placeholder="例如：道路养护"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>男工一日营业额 <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={createForm.maleDailyRevenue}
                  onChange={(e) => setCreateForm({ ...createForm, maleDailyRevenue: e.target.value })}
                  className="rounded-lg"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>女工一日营业额 <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={createForm.femaleDailyRevenue}
                  onChange={(e) => setCreateForm({ ...createForm, femaleDailyRevenue: e.target.value })}
                  className="rounded-lg"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>毛利率 <span className="text-red-500">*</span>（0~1 之间，如 0.3 表示 30%）</Label>
              <Input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={createForm.grossMargin}
                onChange={(e) => setCreateForm({ ...createForm, grossMargin: e.target.value })}
                className="rounded-lg"
                placeholder="0.30"
              />
            </div>
            <div className="space-y-1.5">
              <Label>项目地址</Label>
              <Input
                value={createForm.projectAddress}
                onChange={(e) => setCreateForm({ ...createForm, projectAddress: e.target.value })}
                className="rounded-lg"
                placeholder="选填"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>开始日期</Label>
                <Input
                  type="date"
                  value={createForm.startDate}
                  onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label>结束日期</Label>
                <Input
                  type="date"
                  value={createForm.endDate}
                  onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button className="rounded-lg bg-green-600 hover:bg-green-700" onClick={handleCreate}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== 编辑弹窗 ===== */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">编辑项目</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>项目标题</Label>
              <Input
                value={editForm.projectName}
                onChange={(e) => setEditForm({ ...editForm, projectName: e.target.value })}
                className="rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>男工一日营业额</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={editForm.maleDailyRevenue}
                  onChange={(e) => setEditForm({ ...editForm, maleDailyRevenue: e.target.value })}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label>女工一日营业额</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={editForm.femaleDailyRevenue}
                  onChange={(e) => setEditForm({ ...editForm, femaleDailyRevenue: e.target.value })}
                  className="rounded-lg"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>毛利率（0~1）</Label>
              <Input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={editForm.grossMargin}
                onChange={(e) => setEditForm({ ...editForm, grossMargin: e.target.value })}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label>项目地址</Label>
              <Input
                value={editForm.projectAddress}
                onChange={(e) => setEditForm({ ...editForm, projectAddress: e.target.value })}
                className="rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>开始日期</Label>
                <Input
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label>结束日期</Label>
                <Input
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setEditOpen(false)}>取消</Button>
            <Button className="rounded-lg bg-green-600 hover:bg-green-700" onClick={handleEdit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== 日历弹窗 ===== */}
      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="rounded-2xl max-w-3xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              {selectedProject?.projectName} — 项目日历
            </DialogTitle>
          </DialogHeader>

          {/* 月份切换 */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {calYear}年{calMonth}月
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg" onClick={handleCalPrev}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg" onClick={handleCalNext}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 统计 */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-muted/30 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground/70">当月营业额</p>
              <p className="text-sm font-bold text-foreground">¥{calSummary.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 text-center">
              <p className="text-xs text-blue-400">当月利润</p>
              <p className="text-sm font-bold text-blue-700 dark:text-blue-300">¥{calSummary.totalProfit.toFixed(2)}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 text-center">
              <p className="text-xs text-amber-400">待付工资</p>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-300">¥{calSummary.totalPayableWage.toFixed(2)}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-3 text-center">
              <p className="text-xs text-green-400">净利润</p>
              <p className="text-sm font-bold text-green-700 dark:text-green-300">¥{calSummary.totalNetProfit.toFixed(2)}</p>
            </div>
          </div>

          {/* 日历网格 */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-7 bg-muted/30">
              {weekDays.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => (
                <div key={idx} className="border-t border-r border-border/50 aspect-square p-1">
                  {day && (
                    <div className={`w-full h-full flex flex-col items-center justify-center rounded-lg text-xs transition-colors ${
                      day.status === 1
                        ? "bg-green-500 text-white"
                        : "text-muted-foreground/70 hover:bg-muted/30"
                    }`}>
                      <span className="font-medium">{new Date(day.date).getDate()}</span>
                      {day.status === 1 && (
                        <>
                          <span className="text-[9px] opacity-90">¥{day.revenue.toFixed(0)}</span>
                          <span className="text-[9px] opacity-80">净¥{day.netProfit.toFixed(0)}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 图例 */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>有出勤</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-muted" />
              <span>无记录</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 结项/重启确认弹窗 */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {confirmAction === "close" ? "结项确认" : "重启确认"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            {confirmAction === "close"
              ? `确定结项「${selectedProject?.projectName}」吗？结项后该项目将不再接收新的考勤记录。`
              : `确定重启「${selectedProject?.projectName}」吗？`}
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setConfirmOpen(false)}>取消</Button>
            <Button
              className={`rounded-lg ${confirmAction === "close" ? "bg-amber-600 hover:bg-amber-700" : "bg-green-600 hover:bg-green-700"}`}
              onClick={handleConfirmAction}
            >
              {confirmAction === "close" ? "确认结项" : "确认重启"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
