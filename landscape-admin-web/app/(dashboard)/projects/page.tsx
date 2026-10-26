"use client";

import { useCallback, useEffect, useState } from "react";
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
  Download,
  Wrench,
  MessageSquare,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getProjectList,
  createProject,
  updateProject,
  deleteProject,
  closeProject,
  reopenProject,
  getProjectCalendar,
  getProjectDetailStats,
  getProjectRevenueRecords,
  createProjectRevenueRecord,
  updateProjectRevenueRecord,
  deleteProjectRevenueRecord,
  getCommonServiceNames,
  getProjectCommonServices,
  createProjectCommonService,
  updateProjectCommonService,
  deleteProjectCommonService,
  getProjectCommonRemarks,
  createProjectCommonRemark,
  updateProjectCommonRemark,
  deleteProjectCommonRemark,
  exportProjectRevenueRecords,
} from "@/lib/api";

interface ProjectItem {
  id: number;
  projectName: string;
  projectAddress?: string;
  startDate?: string;
  endDate?: string;
  status: number;
  statusText?: string;
  grossMargin?: number;
  isSystem?: number;
  isSystemText?: string;
  isClosed?: number;
  isClosedText?: string;
  closeTime?: string;
  createTime?: string;
}

interface ProjectStats {
  totalWorkerDays: number;
  todayWorkerDays: number;
  unpaidWage: number;
}

interface RevenueItem {
  id?: number;
  serviceName: string;
  workerType: number | null;
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

interface ServiceNameItem {
  id: number;
  serviceName: string;
  basePrice?: number;
  isSystem: number;
}

interface ProjectCommonService {
  id: number;
  projectId: number;
  serviceName: string;
  workerType: number | null;
  unitPrice: number;
}

interface ProjectCommonRemark {
  id: number;
  projectId: number;
  remarkName: string;
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

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const res = (err as { response?: { data?: { message?: string } } }).response;
    if (res?.data?.message) return res.data.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export default function ProjectsPage() {
  const getToday = () => {
    const now = new Date();
    const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    return chinaTime.toISOString().split("T")[0];
  };

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
    grossMargin: "1",
    startDate: getToday(),
  });

  const [editForm, setEditForm] = useState({
    projectName: "",
    projectAddress: "",
    grossMargin: "",
    startDate: "",
  });

  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  // 结项/重启确认弹窗
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"close" | "reopen" | null>(null);

  // 项目详情弹窗
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailStats, setDetailStats] = useState<ProjectStats>({ totalWorkerDays: 0, todayWorkerDays: 0, unpaidWage: 0 });
  const [revenueRecords, setRevenueRecords] = useState<RevenueRecord[]>([]);
  const [revenueDetailOpen, setRevenueDetailOpen] = useState(false);
  const [selectedRevenueRecord, setSelectedRevenueRecord] = useState<RevenueRecord | null>(null);

  // 营业记录编辑弹窗
  const [revenueEditOpen, setRevenueEditOpen] = useState(false);
  const [revenueEditForm, setRevenueEditForm] = useState<{
    recordId?: number;
    recordDate: string;
    remark: string;
    items: RevenueItem[];
  }>({ recordDate: getToday(), remark: "", items: [] });

  // 服务项编辑弹窗（新增/修改单条）
  const [serviceItemDialogOpen, setServiceItemDialogOpen] = useState(false);
  const [editingServiceItemIndex, setEditingServiceItemIndex] = useState<number | null>(null);
  const [serviceItemForm, setServiceItemForm] = useState<RevenueItem>({
    serviceName: "",
    workerType: null,
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
    remark: "",
  });

  // 营业记录导出
  const [exportOpen, setExportOpen] = useState(false);
  const [exportForm, setExportForm] = useState<{
    startDate: string;
    endDate: string;
    format: "word" | "excel" | "pdf";
  }>({
    startDate: "",
    endDate: "",
    format: "word",
  });
  const [exporting, setExporting] = useState(false);

  // 项目内常用服务
  const [projectCommonServices, setProjectCommonServices] = useState<ProjectCommonService[]>([]);
  const [projectCommonServiceSheetOpen, setProjectCommonServiceSheetOpen] = useState(false);
  const [editingProjectCommonService, setEditingProjectCommonService] = useState<ProjectCommonService | null>(null);
  const [projectCommonServiceForm, setProjectCommonServiceForm] = useState({
    serviceName: "",
    workerType: null as number | null,
    unitPrice: 0,
  });

  // 项目内常用备注
  const [projectCommonRemarks, setProjectCommonRemarks] = useState<ProjectCommonRemark[]>([]);
  const [projectCommonRemarkSheetOpen, setProjectCommonRemarkSheetOpen] = useState(false);
  const [editingProjectCommonRemark, setEditingProjectCommonRemark] = useState<ProjectCommonRemark | null>(null);
  const [projectCommonRemarkForm, setProjectCommonRemarkForm] = useState({
    remarkName: "",
  });

  // 常用服务名称
  const [serviceNames, setServiceNames] = useState<ServiceNameItem[]>([]);

  // 日历状态
  const chinaNow = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);

  const formatRevenueContent = (items: RevenueItem[]): string => {
    if (!items || items.length === 0) return "-";
    const first = items[0];
    const typeText = first.workerType === null
      ? "未选择"
      : first.workerType === 2
      ? "女工"
      : "男工";
    let text = `${first.serviceName}·${typeText}${first.quantity}人`;
    if (first.remark) {
      text += `·${first.remark}`;
    }
    if (items.length > 1) {
      text += `等${items.length}条记录`;
    }
    return text;
  };

  const [calYear, setCalYear] = useState(chinaNow.getFullYear());
  const [calMonth, setCalMonth] = useState(chinaNow.getMonth() + 1);
  const [calDays, setCalDays] = useState<CalendarDay[]>([]);
  const [calSummary, setCalSummary] = useState<CalendarSummary>({
    totalRevenue: 0,
    totalProfit: 0,
    totalPayableWage: 0,
    totalNetProfit: 0,
  });

  const fetchProjects = useCallback(async () => {
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
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "获取项目列表失败"));
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchProjects]);

  // ===== 新增 =====
  const handleCreate = async () => {
    if (!createForm.projectName.trim()) {
      toast.error("项目标题不能为空");
      return;
    }
    if (!createForm.startDate) {
      toast.error("开始日期不能为空");
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
        grossMargin: gm,
        startDate: createForm.startDate || undefined,
      });
      toast.success("新增项目成功");
      setCreateOpen(false);
      setCreateForm({ projectName: "", projectAddress: "", grossMargin: "1", startDate: getToday() });
      fetchProjects();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "新增失败"));
    }
  };

  // ===== 编辑 =====
  const openEdit = (item: ProjectItem) => {
    setSelectedProject(item);
    setEditForm({
      projectName: item.projectName || "",
      projectAddress: item.projectAddress || "",
      grossMargin: item.grossMargin != null ? String(item.grossMargin) : "",
      startDate: item.startDate || "",
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
      if (gm !== undefined) data.grossMargin = gm;
      if (editForm.startDate) data.startDate = editForm.startDate;

      await updateProject(selectedProject.id, data);
      toast.success("修改成功");
      setEditOpen(false);
      fetchProjects();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "修改失败"));
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
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "操作失败"));
    }
  };

  // ===== 项目详情 =====
  const openProjectDetail = async (item: ProjectItem) => {
    setSelectedProject(item);
    setDetailOpen(true);
    try {
      const [statsRes, recordsRes, servicesRes, remarksRes] = await Promise.all([
        getProjectDetailStats(item.id),
        getProjectRevenueRecords(item.id),
        getProjectCommonServices(item.id),
        getProjectCommonRemarks(item.id),
      ]);
      if (statsRes.code === 200 && statsRes.data) {
        setDetailStats(statsRes.data);
      }
      if (recordsRes.code === 200 && recordsRes.data) {
        setRevenueRecords(recordsRes.data);
      }
      if (servicesRes.code === 200 && servicesRes.data) {
        setProjectCommonServices(servicesRes.data);
      }
      if (remarksRes.code === 200 && remarksRes.data) {
        setProjectCommonRemarks(remarksRes.data);
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "加载项目详情失败"));
    }
  };

  // ===== 营业记录 =====
  const resetRevenueEditForm = (record?: RevenueRecord) => {
    if (record) {
      setRevenueEditForm({
        recordId: record.id,
        recordDate: record.recordDate,
        remark: record.remark || "",
        items: record.items.map((it) => ({ ...it })),
      });
    } else {
      setRevenueEditForm({
        recordDate: getToday(),
        remark: "",
        items: [],
      });
    }
  };

  const openCreateRevenue = async () => {
    resetRevenueEditForm();
    await fetchServiceNames();
    setRevenueEditOpen(true);
  };

  const openEditRevenue = async (record: RevenueRecord) => {
    resetRevenueEditForm(record);
    await fetchServiceNames();
    setRevenueEditOpen(true);
  };

  const copyRevenueTemplate = async (record: RevenueRecord) => {
    setRevenueEditForm({
      recordDate: getToday(),
      remark: record.remark || "",
      items: record.items.map((it) => ({ ...it })),
    });
    await fetchServiceNames();
    setRevenueEditOpen(true);
  };

  const handleSaveRevenue = async () => {
    if (!selectedProject) return;
    if (!revenueEditForm.recordDate) {
      toast.error("请选择营业日期");
      return;
    }
    if (revenueEditForm.items.length === 0) {
      toast.error("请至少添加一项服务");
      return;
    }
    for (const item of revenueEditForm.items) {
      if (!item.serviceName.trim()) {
        toast.error("服务名称不能为空");
        return;
      }
      if (!item.quantity || item.quantity < 1) {
        toast.error("数量至少为1");
        return;
      }
      if (item.unitPrice < 0) {
        toast.error("单价不能为负数");
        return;
      }
    }
    try {
      const payload = {
        recordDate: revenueEditForm.recordDate,
        remark: revenueEditForm.remark || undefined,
        items: revenueEditForm.items.map((it) => ({
          serviceName: it.serviceName,
          workerType: it.workerType,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          remark: it.remark || undefined,
        })),
      };
      if (revenueEditForm.recordId) {
        await updateProjectRevenueRecord(revenueEditForm.recordId, payload);
        toast.success("营业记录修改成功");
      } else {
        await createProjectRevenueRecord(selectedProject.id, payload);
        toast.success("营业记录新增成功");
      }
      setRevenueEditOpen(false);
      // 刷新营业记录
      const recordsRes = await getProjectRevenueRecords(selectedProject.id);
      if (recordsRes.code === 200 && recordsRes.data) {
        setRevenueRecords(recordsRes.data);
      }
      // 刷新项目内常用服务（后端会自动新增未出现过的服务名称）
      const servicesRes = await getProjectCommonServices(selectedProject.id);
      if (servicesRes.code === 200 && servicesRes.data) {
        setProjectCommonServices(servicesRes.data);
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "保存失败"));
    }
  };

  const handleDeleteRevenue = async (record: RevenueRecord) => {
    if (!selectedProject) return;
    if (!confirm("确定删除这条营业记录吗？")) return;
    try {
      await deleteProjectRevenueRecord(record.id);
      toast.success("删除成功");
      setRevenueRecords(revenueRecords.filter((r) => r.id !== record.id));
      if (selectedRevenueRecord?.id === record.id) {
        setRevenueDetailOpen(false);
        setSelectedRevenueRecord(null);
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "删除失败"));
    }
  };

  const getDefaultExportDateRange = () => {
    const now = new Date();
    const chinaNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const year = chinaNow.getFullYear();
    const month = chinaNow.getMonth();
    const start = new Date(Date.UTC(year, month - 1, 1, 8, 0, 0));
    const end = new Date(Date.UTC(year, month, 0, 8, 0, 0));
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  };

  const openExportDialog = () => {
    const { startDate, endDate } = getDefaultExportDateRange();
    setExportForm({ startDate, endDate, format: "word" });
    setExportOpen(true);
  };

  const handleExport = async () => {
    if (!selectedProject) return;
    if (!exportForm.startDate || !exportForm.endDate) {
      toast.error("请选择开始和结束日期");
      return;
    }
    if (exportForm.startDate > exportForm.endDate) {
      toast.error("开始日期不能晚于结束日期");
      return;
    }
    setExporting(true);
    try {
      const res = await exportProjectRevenueRecords(selectedProject.id, {
        startDate: exportForm.startDate,
        endDate: exportForm.endDate,
        format: exportForm.format,
      });
      let mimeType: string;
      let ext: string;
      if (exportForm.format === "excel") {
        mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        ext = "xlsx";
      } else if (exportForm.format === "pdf") {
        mimeType = "application/pdf";
        ext = "pdf";
      } else {
        mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        ext = "docx";
      }
      const blob = new Blob([res.data], { type: mimeType });

      // 前端按标题格式生成文件名，避免依赖后端响应头
      const fileName = `${exportForm.startDate.replace(/-/g, ".")}~${exportForm.endDate.replace(/-/g, ".")} - ${selectedProject.projectName} - 绿化用工.${ext}`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("导出成功");
      setExportOpen(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "导出失败"));
    } finally {
      setExporting(false);
    }
  };

  // ===== 项目内常用服务 =====
  const openAddProjectCommonService = async () => {
    setEditingProjectCommonService(null);
    setProjectCommonServiceForm({ serviceName: "", workerType: null, unitPrice: 0 });
    await fetchServiceNames();
    setProjectCommonServiceSheetOpen(true);
  };

  const openEditProjectCommonService = (service: ProjectCommonService) => {
    setEditingProjectCommonService(service);
    setProjectCommonServiceForm({
      serviceName: service.serviceName,
      workerType: service.workerType,
      unitPrice: service.unitPrice,
    });
    setProjectCommonServiceSheetOpen(true);
  };

  const handleSaveProjectCommonService = async () => {
    if (!selectedProject) return;
    if (!projectCommonServiceForm.serviceName.trim()) {
      toast.error("请输入服务名称");
      return;
    }
    if (projectCommonServiceForm.unitPrice < 0) {
      toast.error("单价不能为负数");
      return;
    }
    try {
      const payload = {
        serviceName: projectCommonServiceForm.serviceName.trim(),
        workerType: projectCommonServiceForm.workerType,
        unitPrice: projectCommonServiceForm.unitPrice,
      };
      if (editingProjectCommonService) {
        await updateProjectCommonService(editingProjectCommonService.id, payload);
        toast.success("修改成功");
      } else {
        await createProjectCommonService(selectedProject.id, payload);
        toast.success("新增成功");
      }
      setProjectCommonServiceSheetOpen(false);
      const res = await getProjectCommonServices(selectedProject.id);
      if (res.code === 200 && res.data) {
        setProjectCommonServices(res.data);
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, editingProjectCommonService ? "修改失败" : "新增失败"));
    }
  };

  const handleDeleteProjectCommonService = async (service: ProjectCommonService) => {
    if (!selectedProject) return;
    if (!confirm(`确定删除项目内常用服务「${service.serviceName}」吗？`)) return;
    try {
      await deleteProjectCommonService(service.id);
      toast.success("删除成功");
      const res = await getProjectCommonServices(selectedProject.id);
      if (res.code === 200 && res.data) {
        setProjectCommonServices(res.data);
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "删除失败"));
    }
  };

  // ===== 项目内常用备注 =====
  const openAddProjectCommonRemark = () => {
    setEditingProjectCommonRemark(null);
    setProjectCommonRemarkForm({ remarkName: "" });
    setProjectCommonRemarkSheetOpen(true);
  };

  const openEditProjectCommonRemark = (remark: ProjectCommonRemark) => {
    setEditingProjectCommonRemark(remark);
    setProjectCommonRemarkForm({ remarkName: remark.remarkName });
    setProjectCommonRemarkSheetOpen(true);
  };

  const handleSaveProjectCommonRemark = async () => {
    if (!selectedProject) return;
    if (!projectCommonRemarkForm.remarkName.trim()) {
      toast.error("请输入备注内容");
      return;
    }
    try {
      const remarkName = projectCommonRemarkForm.remarkName.trim();
      if (editingProjectCommonRemark) {
        await updateProjectCommonRemark(editingProjectCommonRemark.id, remarkName);
        toast.success("修改成功");
      } else {
        await createProjectCommonRemark(selectedProject.id, remarkName);
        toast.success("新增成功");
      }
      setProjectCommonRemarkSheetOpen(false);
      const res = await getProjectCommonRemarks(selectedProject.id);
      if (res.code === 200 && res.data) {
        setProjectCommonRemarks(res.data);
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, editingProjectCommonRemark ? "修改失败" : "新增失败"));
    }
  };

  const handleDeleteProjectCommonRemark = async (remark: ProjectCommonRemark) => {
    if (!selectedProject) return;
    if (!confirm(`确定删除项目内常用备注「${remark.remarkName}」吗？`)) return;
    try {
      await deleteProjectCommonRemark(remark.id);
      toast.success("删除成功");
      const res = await getProjectCommonRemarks(selectedProject.id);
      if (res.code === 200 && res.data) {
        setProjectCommonRemarks(res.data);
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "删除失败"));
    }
  };

  const calcItemTotalPrice = (qty: number, price: number) => Math.round(qty * price * 100) / 100;

  const openAddServiceItem = () => {
    setEditingServiceItemIndex(null);
    setServiceItemForm({
      serviceName: "",
      workerType: null,
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      remark: "",
    });
    setServiceItemDialogOpen(true);
  };

  const openEditServiceItem = (idx: number) => {
    const item = revenueEditForm.items[idx];
    if (!item) return;
    setEditingServiceItemIndex(idx);
    setServiceItemForm({ ...item });
    setServiceItemDialogOpen(true);
  };

  const removeServiceItem = (idx: number) => {
    setRevenueEditForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const handleServiceItemFieldChange = (field: keyof RevenueItem, value: string | number | null) => {
    setServiceItemForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "quantity" || field === "unitPrice") {
        const qty = Number(next.quantity) || 0;
        const price = Number(next.unitPrice) || 0;
        next.totalPrice = calcItemTotalPrice(qty, price);
      }
      return next;
    });
  };

  const saveServiceItem = () => {
    if (!serviceItemForm.serviceName.trim()) {
      toast.error("请输入服务名称");
      return;
    }
    if (!serviceItemForm.quantity || serviceItemForm.quantity < 1) {
      toast.error("数量至少为1");
      return;
    }
    if (serviceItemForm.unitPrice < 0) {
      toast.error("单价不能为负数");
      return;
    }
    const itemToSave: RevenueItem = {
      ...serviceItemForm,
      serviceName: serviceItemForm.serviceName.trim(),
      totalPrice: calcItemTotalPrice(Number(serviceItemForm.quantity) || 0, Number(serviceItemForm.unitPrice) || 0),
    };
    setRevenueEditForm((prev) => {
      if (editingServiceItemIndex !== null) {
        const items = [...prev.items];
        items[editingServiceItemIndex] = itemToSave;
        return { ...prev, items };
      }
      return { ...prev, items: [...prev.items, itemToSave] };
    });
    setServiceItemDialogOpen(false);
    setEditingServiceItemIndex(null);
  };

  // ===== 常用服务名称 =====
  const fetchServiceNames = async () => {
    try {
      const res = await getCommonServiceNames();
      if (res.code === 200 && res.data) {
        setServiceNames(res.data);
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "获取常用服务名称失败"));
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
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "删除失败"));
    }
  };

  // ===== 日历 =====
  const openCalendar = async (item: ProjectItem) => {
    setSelectedProject(item);
    const now = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
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
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "获取日历失败"));
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
    const today = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
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
            {loading ? (
              <p className="text-center py-12 text-muted-foreground/70 text-sm">加载中...</p>
            ) : projects.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground/70 text-sm">暂无项目</p>
            ) : (
              projects.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between px-5 py-4 transition-colors ${
                    manageMode ? "hover:bg-green-50 dark:hover:bg-green-950/20" : "hover:bg-green-50 dark:hover:bg-green-950/20 cursor-pointer"
                  }`}
                  onClick={() => {
                    if (!manageMode) openProjectDetail(item);
                  }}
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
                        <span>毛利率:{((item.grossMargin ?? 0) * 100).toFixed(0)}%</span>
                        {item.startDate && <span>开始:{item.startDate}</span>}
                        {item.endDate && <span>结束:{item.endDate}</span>}
                        {item.projectAddress && <span className="truncate max-w-[200px]">{item.projectAddress}</span>}
                      </div>
                      {!manageMode && (
                        <div className="mt-1 text-xs text-muted-foreground/70">点击查看详情与营业记录</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {/* 日历按钮始终可见 */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 rounded-lg text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCalendar(item);
                      }}
                      title="日历"
                    >
                      <Calendar className="w-4 h-4" />
                    </Button>

                    {manageMode && item.isSystem !== 1 && item.status === 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-lg text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                        onClick={(e) => { e.stopPropagation(); openCloseConfirm(item); }}
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
                        onClick={(e) => { e.stopPropagation(); openReopenConfirm(item); }}
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
                        onClick={(e) => { e.stopPropagation(); openEdit(item); }}
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
                        onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
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
            <div className="space-y-1.5">
              <Label>开始日期 <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={createForm.startDate}
                onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                className="rounded-lg"
              />
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
            <div className="space-y-1.5">
              <Label>开始日期</Label>
              <Input
                type="date"
                value={editForm.startDate}
                onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                className="rounded-lg"
              />
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

      {/* ===== 项目详情弹窗 ===== */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent
          showCloseButton={false}
          className="bg-transparent border-0 shadow-none ring-0 rounded-none p-0 max-w-none sm:max-w-none w-auto flex flex-col lg:flex-row items-start justify-center gap-4 overflow-visible"
        >
          {/* 左侧：项目内常用服务 & 常用备注 */}
          <div className="w-full lg:w-72 flex flex-col gap-4">
            {/* 项目内常用服务 */}
            <div className="rounded-2xl bg-popover p-4 shadow-lg ring-1 ring-foreground/10 max-h-[50vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 mb-3 border-b">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-green-600" />
                  项目内常用服务
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-7 h-7 rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={openAddProjectCommonService}
                  title="新增项目内常用服务"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {projectCommonServices.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground bg-muted/30 rounded-xl">
                  暂无常用服务
                </div>
              ) : (
                <div className="space-y-2">
                  {projectCommonServices.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between rounded-xl border border-border p-2.5 hover:bg-muted/20 transition-colors"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-sm font-medium truncate">{service.serviceName}</div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 rounded">
                            {service.workerType === null ? "未选择" : service.workerType === 2 ? "女工" : "男工"}
                          </Badge>
                          <span>¥{service.unitPrice.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => openEditProjectCommonService(service)}
                          title="编辑"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteProjectCommonService(service)}
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 项目内常用备注 */}
            <div className="rounded-2xl bg-popover p-4 shadow-lg ring-1 ring-foreground/10 max-h-[35vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 mb-3 border-b">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                  项目内常用备注
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-7 h-7 rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={openAddProjectCommonRemark}
                  title="新增项目内常用备注"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {projectCommonRemarks.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground bg-muted/30 rounded-xl">
                  暂无常用备注
                </div>
              ) : (
                <div className="space-y-2">
                  {projectCommonRemarks.map((remark) => (
                    <div
                      key={remark.id}
                      className="flex items-center justify-between rounded-xl border border-border p-2.5 hover:bg-muted/20 transition-colors"
                    >
                      <div className="text-sm truncate">{remark.remarkName}</div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => openEditProjectCommonRemark(remark)}
                          title="编辑"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteProjectCommonRemark(remark)}
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右侧：项目详情 */}
          <div className="w-full lg:max-w-3xl rounded-2xl bg-popover p-4 shadow-lg ring-1 ring-foreground/10 max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5 text-green-600" />
                {selectedProject?.projectName}
              </DialogTitle>
            </DialogHeader>

            {/* 三个统计 rounded boxes */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-2xl p-4 text-center">
                <p className="text-xs text-blue-500 mb-1">总工作天数</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{detailStats.totalWorkerDays}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950/30 rounded-2xl p-4 text-center">
                <p className="text-xs text-green-500 mb-1">今日工作天数</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{detailStats.todayWorkerDays}</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4 text-center">
                <p className="text-xs text-amber-500 mb-1">累计未付工资</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">¥{detailStats.unpaidWage.toFixed(2)}</p>
              </div>
            </div>

            {/* 营业记录 */}
            <div className="space-y-3 mt-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">营业记录</h4>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg"
                  onClick={openExportDialog}
                >
                  <Download className="w-4 h-4 mr-1" />
                  导出营业记录
                </Button>
              </div>
              {revenueRecords.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground bg-muted/30 rounded-xl">
                  暂无营业记录
                </div>
              ) : (
                <div className="space-y-2">
                  {revenueRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-muted/20 transition-colors"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-sm font-medium">{record.recordDate}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {formatRevenueContent(record.items)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">¥{record.totalAmount.toFixed(2)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 rounded-lg"
                          onClick={() => { setSelectedRevenueRecord(record); setRevenueDetailOpen(true); }}
                          title="查看"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* ===== 营业记录明细弹窗 ===== */}
      <Dialog open={revenueDetailOpen} onOpenChange={setRevenueDetailOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg">
              营业记录明细 · {selectedRevenueRecord?.recordDate}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {(selectedRevenueRecord?.items || []).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-border p-3"
              >
                <div>
                  <div className="text-sm font-medium">{item.serviceName}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.workerType === null ? "" : `${item.workerType === 2 ? "女工" : "男工"} · `}{item.quantity} × ¥{item.unitPrice.toFixed(2)}
                  </div>
                  {item.remark && <div className="text-xs text-muted-foreground mt-0.5">备注：{item.remark}</div>}
                </div>
                <div className="text-sm font-bold">¥{item.totalPrice.toFixed(2)}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-end text-sm font-bold pt-2">
            合计：¥{selectedRevenueRecord?.totalAmount.toFixed(2)}
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== 营业记录编辑弹窗 ===== */}
      <Dialog open={revenueEditOpen} onOpenChange={setRevenueEditOpen}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {revenueEditForm.recordId ? "编辑营业记录" : "新增营业记录"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>营业日期 <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={revenueEditForm.recordDate}
                  onChange={(e) => setRevenueEditForm({ ...revenueEditForm, recordDate: e.target.value })}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label>备注</Label>
                <Input
                  value={revenueEditForm.remark}
                  onChange={(e) => setRevenueEditForm({ ...revenueEditForm, remark: e.target.value })}
                  className="rounded-lg"
                  placeholder="选填"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>服务项</Label>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg"
                  onClick={openAddServiceItem}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  添加服务项
                </Button>
              </div>

              {revenueEditForm.items.length === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground bg-muted/30 rounded-xl">
                  请点击右上角添加服务项
                </div>
              )}

              {revenueEditForm.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">{item.serviceName}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.workerType === null ? "" : `${item.workerType === 2 ? "女工" : "男工"} · `}{item.quantity} × ¥{item.unitPrice.toFixed(2)}
                    </div>
                    {item.remark && <div className="text-xs text-muted-foreground">备注：{item.remark}</div>}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold mr-2">¥{item.totalPrice.toFixed(2)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => openEditServiceItem(idx)}
                      title="修改"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeServiceItem(idx)}
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setRevenueEditOpen(false)}>取消</Button>
            <Button className="rounded-lg bg-green-600 hover:bg-green-700" onClick={handleSaveRevenue}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== 营业记录导出弹窗 ===== */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">导出营业记录</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>开始日期 <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={exportForm.startDate}
                  onChange={(e) => setExportForm({ ...exportForm, startDate: e.target.value })}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label>结束日期 <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={exportForm.endDate}
                  onChange={(e) => setExportForm({ ...exportForm, endDate: e.target.value })}
                  className="rounded-lg"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>导出格式 <span className="text-red-500">*</span></Label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="word"
                    checked={exportForm.format === "word"}
                    onChange={(e) => setExportForm({ ...exportForm, format: e.target.value as "word" | "excel" | "pdf" })}
                  />
                  Word
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="excel"
                    checked={exportForm.format === "excel"}
                    onChange={(e) => setExportForm({ ...exportForm, format: e.target.value as "word" | "excel" | "pdf" })}
                  />
                  Excel
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="pdf"
                    checked={exportForm.format === "pdf"}
                    onChange={(e) => setExportForm({ ...exportForm, format: e.target.value as "word" | "excel" | "pdf" })}
                  />
                  PDF
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setExportOpen(false)} disabled={exporting}>取消</Button>
            <Button className="rounded-lg bg-green-600 hover:bg-green-700" onClick={handleExport} disabled={exporting}>
              {exporting ? "导出中..." : "确认导出"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== 项目内常用服务编辑侧滑窗口 ===== */}
      <Sheet open={projectCommonServiceSheetOpen} onOpenChange={setProjectCommonServiceSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md rounded-l-2xl">
          <SheetHeader className="px-6">
            <SheetTitle className="text-lg">
              {editingProjectCommonService ? "编辑项目内常用服务" : "新增项目内常用服务"}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4 px-6">
            {!editingProjectCommonService && (
              <div className="space-y-1.5">
                <Label>选择全局常用服务作为模板</Label>
                <select
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                  value=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      const selected = serviceNames.find((s) => s.serviceName === val);
                      if (selected) {
                        setProjectCommonServiceForm((prev) => ({
                          ...prev,
                          serviceName: selected.serviceName,
                          unitPrice: selected.basePrice ?? prev.unitPrice,
                        }));
                      }
                    }
                  }}
                >
                  <option value="">选择模板（可选）</option>
                  {serviceNames.map((s) => (
                    <option key={s.id} value={s.serviceName}>{s.serviceName}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>服务名称 <span className="text-red-500">*</span></Label>
              <Input
                value={projectCommonServiceForm.serviceName}
                onChange={(e) => setProjectCommonServiceForm({ ...projectCommonServiceForm, serviceName: e.target.value })}
                className="rounded-lg"
                placeholder="服务名称"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>类型</Label>
                <select
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                  value={projectCommonServiceForm.workerType ?? ""}
                  onChange={(e) => setProjectCommonServiceForm({
                    ...projectCommonServiceForm,
                    workerType: e.target.value === "" ? null : Number(e.target.value),
                  })}
                >
                  <option value=""> </option>
                  <option value={1}>男工</option>
                  <option value={2}>女工</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>默认单价</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={projectCommonServiceForm.unitPrice}
                  onChange={(e) => setProjectCommonServiceForm({ ...projectCommonServiceForm, unitPrice: Number(e.target.value) })}
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>
          <SheetFooter className="px-6">
            <Button variant="outline" className="rounded-lg" onClick={() => setProjectCommonServiceSheetOpen(false)}>取消</Button>
            <Button className="rounded-lg bg-green-600 hover:bg-green-700" onClick={handleSaveProjectCommonService}>保存</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ===== 项目内常用备注编辑侧滑窗口 ===== */}
      <Sheet open={projectCommonRemarkSheetOpen} onOpenChange={setProjectCommonRemarkSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md rounded-l-2xl">
          <SheetHeader className="px-6">
            <SheetTitle className="text-lg">
              {editingProjectCommonRemark ? "编辑项目内常用备注" : "新增项目内常用备注"}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4 px-6">
            <div className="space-y-1.5">
              <Label>备注内容 <span className="text-red-500">*</span></Label>
              <Input
                value={projectCommonRemarkForm.remarkName}
                onChange={(e) => setProjectCommonRemarkForm({ ...projectCommonRemarkForm, remarkName: e.target.value })}
                className="rounded-lg"
                placeholder="备注内容"
              />
            </div>
          </div>
          <SheetFooter className="px-6">
            <Button variant="outline" className="rounded-lg" onClick={() => setProjectCommonRemarkSheetOpen(false)}>取消</Button>
            <Button className="rounded-lg bg-green-600 hover:bg-green-700" onClick={handleSaveProjectCommonRemark}>保存</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ===== 服务项编辑侧滑窗口 ===== */}
      <Sheet open={serviceItemDialogOpen} onOpenChange={setServiceItemDialogOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md rounded-l-2xl">
          <SheetHeader className="px-6">
            <SheetTitle className="text-lg">
              {editingServiceItemIndex !== null ? "修改服务项" : "新增服务项"}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4 px-6">
            <div className="space-y-1.5">
              <Label>项目常用服务</Label>
              <select
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                value={projectCommonServices.some((s) => s.serviceName === serviceItemForm.serviceName) ? serviceItemForm.serviceName : ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    const selected = projectCommonServices.find((s) => s.serviceName === val);
                    if (selected) {
                      handleServiceItemFieldChange("serviceName", selected.serviceName);
                      handleServiceItemFieldChange("workerType", selected.workerType);
                      handleServiceItemFieldChange("unitPrice", selected.unitPrice);
                    }
                  }
                }}
              >
                <option value="">选择项目常用服务</option>
                {projectCommonServices.map((s) => (
                  <option key={s.id} value={s.serviceName}>{s.serviceName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>服务名称 <span className="text-red-500">*</span></Label>
              <Input
                value={serviceItemForm.serviceName}
                onChange={(e) => handleServiceItemFieldChange("serviceName", e.target.value)}
                className="rounded-lg"
                placeholder="服务名称"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>类型</Label>
                <select
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                  value={serviceItemForm.workerType ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleServiceItemFieldChange("workerType", val === "" ? null : Number(val));
                  }}
                >
                  <option value=""> </option>
                  <option value={1}>男工</option>
                  <option value={2}>女工</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>数量</Label>
                <Input
                  type="number"
                  min={1}
                  value={serviceItemForm.quantity}
                  onChange={(e) => handleServiceItemFieldChange("quantity", Number(e.target.value))}
                  className="rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>单价</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={serviceItemForm.unitPrice}
                  onChange={(e) => handleServiceItemFieldChange("unitPrice", Number(e.target.value))}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label>总价</Label>
                <div className="h-10 flex items-center text-base font-bold">¥{serviceItemForm.totalPrice.toFixed(2)}</div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>备注</Label>
              <Input
                value={serviceItemForm.remark}
                onChange={(e) => handleServiceItemFieldChange("remark", e.target.value)}
                className="rounded-lg"
                placeholder="选填"
              />
            </div>
          </div>
          <SheetFooter className="px-6">
            <Button variant="outline" className="rounded-lg" onClick={() => setServiceItemDialogOpen(false)}>取消</Button>
            <Button className="rounded-lg bg-green-600 hover:bg-green-700" onClick={saveServiceItem}>保存</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

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
