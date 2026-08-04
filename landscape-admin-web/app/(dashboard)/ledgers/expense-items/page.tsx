"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Eye,
  Wrench,
  MessageSquare,
  ArrowLeft,
  Wallet,
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
  getExpenseItemList,
  createExpenseItem,
  updateExpenseItem,
  deleteExpenseItem,
  getExpenseItemDetail,
  createExpenseItemCommonSubject,
  updateExpenseItemCommonSubject,
  deleteExpenseItemCommonSubject,
  createExpenseItemCommonRemark,
  updateExpenseItemCommonRemark,
  deleteExpenseItemCommonRemark,
  getExpenseRecords,
} from "@/lib/api";
import { useRouter } from "next/navigation";

interface ProjectOption {
  id: number;
  projectName: string;
}

interface ExpenseItem {
  id: number;
  projectId: number;
  projectName: string;
  itemName: string;
  description?: string;
  totalExpense: number;
  createTime?: string;
}

interface ExpenseRecord {
  id: number;
  recordDate: string;
  totalAmount: number;
  items: { subjectName: string; quantity: number; unitPrice: number; totalPrice: number; remark: string }[];
}

interface CommonSubject {
  id: number;
  expenseItemId: number;
  subjectName: string;
}

interface CommonRemark {
  id: number;
  expenseItemId: number;
  remarkName: string;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const res = (err as { response?: { data?: { message?: string } } }).response;
    if (res?.data?.message) return res.data.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export default function ExpenseItemsPage() {
  const router = useRouter();
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [manageMode, setManageMode] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);

  // 弹窗状态
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExpenseItem | null>(null);
  const [detailRecords, setDetailRecords] = useState<ExpenseRecord[]>([]);
  const [commonSubjects, setCommonSubjects] = useState<CommonSubject[]>([]);
  const [commonRemarks, setCommonRemarks] = useState<CommonRemark[]>([]);

  // 新增/编辑开支项目
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpenseItem | null>(null);
  const [form, setForm] = useState({ projectId: "", itemName: "", description: "" });

  // 常用主体/备注编辑
  const [subjectSheetOpen, setSubjectSheetOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<CommonSubject | null>(null);
  const [subjectForm, setSubjectForm] = useState({ subjectName: "" });

  const [remarkSheetOpen, setRemarkSheetOpen] = useState(false);
  const [editingRemark, setEditingRemark] = useState<CommonRemark | null>(null);
  const [remarkForm, setRemarkForm] = useState({ remarkName: "" });

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await getProjectList({ pageNum: 1, pageSize: 100 });
      if (res.code === 200 && res.data?.records) {
        setProjects(res.data.records);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchItems = useCallback(async (currentPage = page) => {
    setLoading(true);
    try {
      const res = await getExpenseItemList({
        pageNum: currentPage,
        pageSize,
        keyword: keyword || undefined,
      });
      if (res.code === 200 && res.data?.records) {
        setItems(res.data.records);
        setTotal(res.data.total || 0);
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "获取开支项目列表失败"));
    } finally {
      setLoading(false);
    }
  }, [keyword, page, pageSize]);

  useEffect(() => {
    fetchProjects();
    const timer = setTimeout(() => fetchItems(), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchItems(1);
    }, 0);
    return () => clearTimeout(timer);
  }, [keyword]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchItems(newPage);
  };

  const openCreate = () => {
    setEditingItem(null);
    setForm({ projectId: "", itemName: "", description: "" });
    setFormOpen(true);
  };

  const openEdit = (item: ExpenseItem) => {
    setEditingItem(item);
    setForm({
      projectId: String(item.projectId),
      itemName: item.itemName,
      description: item.description || "",
    });
    setFormOpen(true);
  };

  const handleSaveItem = async () => {
    if (!form.projectId) {
      toast.error("请选择所属项目");
      return;
    }
    if (!form.itemName.trim()) {
      toast.error("请输入开支项目名称");
      return;
    }
    try {
      const payload = {
        projectId: Number(form.projectId),
        itemName: form.itemName.trim(),
        description: form.description || undefined,
      };
      if (editingItem) {
        await updateExpenseItem(editingItem.id, payload);
        toast.success("修改成功");
      } else {
        await createExpenseItem(payload);
        toast.success("新增成功");
      }
      setFormOpen(false);
      fetchItems();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "保存失败"));
    }
  };

  const handleDelete = async (item: ExpenseItem) => {
    if (!confirm(`确定删除开支项目「${item.itemName}」吗？`)) return;
    try {
      await deleteExpenseItem(item.id);
      toast.success("删除成功");
      fetchItems();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "删除失败"));
    }
  };

  const openDetail = async (item: ExpenseItem) => {
    setSelectedItem(item);
    setDetailOpen(true);
    try {
      const [detailRes, recordsRes] = await Promise.all([
        getExpenseItemDetail(item.id),
        getExpenseRecords({ expenseItemId: item.id, pageNum: 1, pageSize: 100 }),
      ]);
      if (detailRes.code === 200 && detailRes.data) {
        setCommonSubjects(detailRes.data.commonSubjects || []);
        setCommonRemarks(detailRes.data.commonRemarks || []);
      }
      if (recordsRes.code === 200 && recordsRes.data) {
        setDetailRecords(recordsRes.data.records || []);
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "加载详情失败"));
    }
  };

  const refreshDetail = async (itemId: number) => {
    try {
      const detailRes = await getExpenseItemDetail(itemId);
      if (detailRes.code === 200 && detailRes.data) {
        setCommonSubjects(detailRes.data.commonSubjects || []);
        setCommonRemarks(detailRes.data.commonRemarks || []);
      }
    } catch {
      // ignore
    }
  };

  const formatExpenseContent = (record: ExpenseRecord): string => {
    if (!record.items || record.items.length === 0) return "-";
    const first = record.items[0];
    let text = `${first.subjectName}×${first.quantity}`;
    if (first.remark) text += `·${first.remark}`;
    if (record.items.length > 1) text += ` 等${record.items.length}条`;
    return text;
  };

  // 常用主体
  const openAddSubject = () => {
    setEditingSubject(null);
    setSubjectForm({ subjectName: "" });
    setSubjectSheetOpen(true);
  };
  const openEditSubject = (subject: CommonSubject) => {
    setEditingSubject(subject);
    setSubjectForm({ subjectName: subject.subjectName });
    setSubjectSheetOpen(true);
  };
  const handleSaveSubject = async () => {
    if (!selectedItem) return;
    if (!subjectForm.subjectName.trim()) {
      toast.error("请输入主体名称");
      return;
    }
    try {
      if (editingSubject) {
        await updateExpenseItemCommonSubject(editingSubject.id, { subjectName: subjectForm.subjectName.trim() });
        toast.success("修改成功");
      } else {
        await createExpenseItemCommonSubject(selectedItem.id, { subjectName: subjectForm.subjectName.trim() });
        toast.success("新增成功");
      }
      setSubjectSheetOpen(false);
      refreshDetail(selectedItem.id);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "保存失败"));
    }
  };
  const handleDeleteSubject = async (subject: CommonSubject) => {
    if (!selectedItem) return;
    if (!confirm(`确定删除常用主体「${subject.subjectName}」吗？`)) return;
    try {
      await deleteExpenseItemCommonSubject(subject.id);
      toast.success("删除成功");
      refreshDetail(selectedItem.id);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "删除失败"));
    }
  };

  // 常用备注
  const openAddRemark = () => {
    setEditingRemark(null);
    setRemarkForm({ remarkName: "" });
    setRemarkSheetOpen(true);
  };
  const openEditRemark = (remark: CommonRemark) => {
    setEditingRemark(remark);
    setRemarkForm({ remarkName: remark.remarkName });
    setRemarkSheetOpen(true);
  };
  const handleSaveRemark = async () => {
    if (!selectedItem) return;
    if (!remarkForm.remarkName.trim()) {
      toast.error("请输入备注内容");
      return;
    }
    try {
      if (editingRemark) {
        await updateExpenseItemCommonRemark(editingRemark.id, { remarkName: remarkForm.remarkName.trim() });
        toast.success("修改成功");
      } else {
        await createExpenseItemCommonRemark(selectedItem.id, { remarkName: remarkForm.remarkName.trim() });
        toast.success("新增成功");
      }
      setRemarkSheetOpen(false);
      refreshDetail(selectedItem.id);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "保存失败"));
    }
  };
  const handleDeleteRemark = async (remark: CommonRemark) => {
    if (!selectedItem) return;
    if (!confirm(`确定删除常用备注「${remark.remarkName}」吗？`)) return;
    try {
      await deleteExpenseItemCommonRemark(remark.id);
      toast.success("删除成功");
      refreshDetail(selectedItem.id);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "删除失败"));
    }
  };

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg"
            onClick={() => router.push("/ledgers/expense-records")}
            title="返回开销记录"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Building2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h2 className="text-lg font-semibold text-foreground">开支项目管理</h2>
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
              onClick={openCreate}
            >
              <Plus className="w-4 h-4 mr-1" />
              新增开支项目
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
                placeholder="搜索开支项目"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="rounded-lg pl-9 h-9 text-sm"
                onKeyDown={(e) => e.key === "Enter" && fetchItems()}
              />
            </div>
            <Button size="sm" className="rounded-lg h-9 bg-green-600 hover:bg-green-700" onClick={() => fetchItems(1)}>
              查询
            </Button>
            <Button size="sm" variant="outline" className="rounded-lg h-9" onClick={() => { setKeyword(""); setPage(1); fetchItems(1); }}>
              <RotateCcw className="w-4 h-4 mr-1" />
              重置
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
            ) : items.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground/70 text-sm">暂无开支项目</p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between px-5 py-4 transition-colors ${
                    manageMode ? "hover:bg-green-50 dark:hover:bg-green-950/20" : "hover:bg-green-50 dark:hover:bg-green-950/20 cursor-pointer"
                  }`}
                  onClick={() => {
                    if (!manageMode) openDetail(item);
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-700 dark:text-green-300 text-sm font-bold shrink-0">
                      {item.itemName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground truncate">{item.itemName}</p>
                        <Badge variant="outline" className="rounded-md text-[10px] border-green-200 dark:border-green-800/50 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30">
                          {item.projectName || "未关联项目"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground/70 mt-1 flex-wrap">
                        {item.description && <span className="truncate max-w-[200px]">{item.description}</span>}
                        <span>总开支：¥{(item.totalExpense || 0).toFixed(2)}</span>
                      </div>
                      {!manageMode && (
                        <div className="mt-1 text-xs text-muted-foreground/70">点击查看详情与开支记录</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!manageMode && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-lg"
                        onClick={(e) => { e.stopPropagation(); openDetail(item); }}
                        title="查看"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    {manageMode && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-lg text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                          onClick={(e) => { e.stopPropagation(); openEdit(item); }}
                          title="编辑"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-lg text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 分页 */}
      {total > pageSize && (
        <div className="flex items-center justify-between px-1">
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

      {/* 新增/编辑弹窗 */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">{editingItem ? "编辑开支项目" : "新增开支项目"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>所属项目 <span className="text-red-500">*</span></Label>
              <select
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              >
                <option value="">请选择项目</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.projectName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>项目名称 <span className="text-red-500">*</span></Label>
              <Input
                value={form.itemName}
                onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                className="rounded-lg"
                placeholder="例如：苗木采购"
              />
            </div>
            <div className="space-y-1.5">
              <Label>描述</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="rounded-lg"
                placeholder="选填"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setFormOpen(false)}>取消</Button>
            <Button className="rounded-lg bg-green-600 hover:bg-green-700" onClick={handleSaveItem}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 详情弹窗 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent
          showCloseButton={false}
          className="bg-transparent border-0 shadow-none ring-0 rounded-none p-0 max-w-none sm:max-w-none w-auto flex flex-col lg:flex-row items-start justify-center gap-4 overflow-visible"
        >
          {/* 左侧：常用主体 & 常用备注 */}
          <div className="w-full lg:w-72 flex flex-col gap-4">
            {/* 常用主体 */}
            <div className="rounded-2xl bg-popover p-4 shadow-lg ring-1 ring-foreground/10 max-h-[50vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 mb-3 border-b">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-green-600" />
                  项目内常用主体
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-7 h-7 rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={openAddSubject}
                  title="新增常用主体"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {commonSubjects.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground bg-muted/30 rounded-xl">暂无常用主体</div>
              ) : (
                <div className="space-y-2">
                  {commonSubjects.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-xl border border-border p-2.5 hover:bg-muted/20 transition-colors">
                      <div className="text-sm truncate">{s.subjectName}</div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => openEditSubject(s)} title="编辑">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteSubject(s)} title="删除">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 常用备注 */}
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
                  onClick={openAddRemark}
                  title="新增常用备注"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {commonRemarks.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground bg-muted/30 rounded-xl">暂无常用备注</div>
              ) : (
                <div className="space-y-2">
                  {commonRemarks.map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-xl border border-border p-2.5 hover:bg-muted/20 transition-colors">
                      <div className="text-sm truncate">{r.remarkName}</div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => openEditRemark(r)} title="编辑">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteRemark(r)} title="删除">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右侧：项目总开支 & 开支记录 */}
          <div className="w-full lg:max-w-3xl rounded-2xl bg-popover p-4 shadow-lg ring-1 ring-foreground/10 max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5 text-green-600" />
                {selectedItem?.itemName}
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="bg-green-50 dark:bg-green-950/30 rounded-2xl p-4 text-center">
                <p className="text-xs text-green-500 mb-1">项目总开支</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">¥{(selectedItem?.totalExpense || 0).toFixed(2)}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-2xl p-4 text-center">
                <p className="text-xs text-blue-500 mb-1">记录条数</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{detailRecords.length}</p>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">开支记录</h4>
                <Button
                  size="sm"
                  className="rounded-lg bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setDetailOpen(false);
                    router.push("/ledgers/expense-records");
                  }}
                >
                  <Wallet className="w-4 h-4 mr-1" />
                  去管理开销记录
                </Button>
              </div>
              {detailRecords.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground bg-muted/30 rounded-xl">暂无开支记录</div>
              ) : (
                <div className="space-y-2">
                  {detailRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-muted/20 transition-colors">
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-sm font-medium">{record.recordDate}</div>
                        <div className="text-xs text-muted-foreground truncate">{formatExpenseContent(record)}</div>
                      </div>
                      <span className="text-sm font-bold">¥{record.totalAmount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 常用主体编辑侧滑 */}
      <Sheet open={subjectSheetOpen} onOpenChange={setSubjectSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md rounded-l-2xl">
          <SheetHeader className="px-6">
            <SheetTitle className="text-lg">{editingSubject ? "编辑常用主体" : "新增常用主体"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4 px-6">
            <div className="space-y-1.5">
              <Label>主体名称 <span className="text-red-500">*</span></Label>
              <Input
                value={subjectForm.subjectName}
                onChange={(e) => setSubjectForm({ subjectName: e.target.value })}
                className="rounded-lg"
                placeholder="主体名称"
              />
            </div>
          </div>
          <SheetFooter className="px-6">
            <Button variant="outline" className="rounded-lg" onClick={() => setSubjectSheetOpen(false)}>取消</Button>
            <Button className="rounded-lg bg-green-600 hover:bg-green-700" onClick={handleSaveSubject}>保存</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* 常用备注编辑侧滑 */}
      <Sheet open={remarkSheetOpen} onOpenChange={setRemarkSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md rounded-l-2xl">
          <SheetHeader className="px-6">
            <SheetTitle className="text-lg">{editingRemark ? "编辑常用备注" : "新增常用备注"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4 px-6">
            <div className="space-y-1.5">
              <Label>备注内容 <span className="text-red-500">*</span></Label>
              <Input
                value={remarkForm.remarkName}
                onChange={(e) => setRemarkForm({ remarkName: e.target.value })}
                className="rounded-lg"
                placeholder="备注内容"
              />
            </div>
          </div>
          <SheetFooter className="px-6">
            <Button variant="outline" className="rounded-lg" onClick={() => setRemarkSheetOpen(false)}>取消</Button>
            <Button className="rounded-lg bg-green-600 hover:bg-green-700" onClick={handleSaveRemark}>保存</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
