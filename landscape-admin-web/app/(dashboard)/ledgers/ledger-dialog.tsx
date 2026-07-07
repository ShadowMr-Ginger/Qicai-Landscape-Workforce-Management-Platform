"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Lock,
  LockOpen,
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
import { Badge } from "@/components/ui/badge";
import {
  createLedger,
  updateLedger,
  getLedgerDetail,
  getProjectCommonServices,
} from "@/lib/api";

interface ProjectOption {
  id: number;
  projectName: string;
}

interface LedgerItemForm {
  serviceName: string;
  workerType: number | null;
  unitPrice: number;
  quantity: number;
}

interface LedgerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingId?: number | null;
  projects: ProjectOption[];
}

function getToday(): string {
  const now = new Date();
  const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return chinaTime.toISOString().split("T")[0];
}

function calcTotalPrice(qty: number, price: number) {
  return Math.round(qty * price * 100) / 100;
}

export default function LedgerDialog({
  open,
  onOpenChange,
  onSuccess,
  editingId,
  projects,
}: LedgerDialogProps) {
  const [recordDate, setRecordDate] = useState(getToday());
  const [projectId, setProjectId] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [items, setItems] = useState<LedgerItemForm[]>([]);
  const [loading, setLoading] = useState(false);

  const [projectFilter, setProjectFilter] = useState("");
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const projectDropdownRef = useRef<HTMLDivElement>(null);

  const [projectCommonServices, setProjectCommonServices] = useState<
    { id: number; serviceName: string; workerType: number | null; unitPrice: number }[]
  >([]);

  const [itemSheetOpen, setItemSheetOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState<LedgerItemForm>({
    serviceName: "",
    workerType: null,
    unitPrice: 0,
    quantity: 1,
  });

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // 点击外部关闭项目下拉
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        projectDropdownRef.current &&
        !projectDropdownRef.current.contains(e.target as Node) &&
        projectInputRef.current &&
        !projectInputRef.current.contains(e.target as Node)
      ) {
        setProjectDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 打开时初始化
  useEffect(() => {
    if (!open) return;
    setProjectFilter("");
    setProjectDropdownOpen(false);
    if (editingId) {
      loadDetail(editingId);
    } else {
      setRecordDate(getToday());
      setProjectId(null);
      setLocked(false);
      setItems([]);
      setProjectCommonServices([]);
    }
  }, [open, editingId]);

  // 锁定后加载项目常用服务
  useEffect(() => {
    if (locked && projectId) {
      fetchProjectCommonServices(projectId);
    } else {
      setProjectCommonServices([]);
    }
  }, [locked, projectId]);

  const loadDetail = async (id: number) => {
    try {
      setLoading(true);
      const res = await getLedgerDetail(id);
      if (res.code === 200 && res.data) {
        const data = res.data;
        setRecordDate(data.recordDate);
        setProjectId(data.projectId);
        setLocked(true);
        setItems(
          (data.items || []).map((it: any) => ({
            serviceName: it.serviceName,
            workerType: it.workerType,
            unitPrice: it.unitPrice,
            quantity: it.quantity,
          }))
        );
        const project = projects.find((p) => p.id === data.projectId);
        if (project) setProjectFilter(project.projectName);
      } else {
        toast.error(res.message || "加载失败");
      }
    } catch {
      toast.error("加载台账失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectCommonServices = async (pid: number) => {
    try {
      const res = await getProjectCommonServices(pid);
      if (res.code === 200 && res.data) {
        setProjectCommonServices(res.data);
      }
    } catch {
      // ignore
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.projectName.toLowerCase().includes(projectFilter.trim().toLowerCase())
  );

  const selectedProjectName =
    projects.find((p) => p.id === projectId)?.projectName || "";

  const canLock = recordDate && projectId;

  const handleLock = () => {
    if (!recordDate || !projectId) {
      toast.error("请先选择日期和项目");
      return;
    }
    setLocked(true);
  };

  const handleUnlock = () => {
    setLocked(false);
  };

  const openAddItem = () => {
    setEditingItemIndex(null);
    setItemForm({ serviceName: "", workerType: null, unitPrice: 0, quantity: 1 });
    setItemSheetOpen(true);
  };

  const openEditItem = (idx: number) => {
    setEditingItemIndex(idx);
    setItemForm({ ...items[idx] });
    setItemSheetOpen(true);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleItemFieldChange = (
    field: keyof LedgerItemForm,
    value: string | number | null
  ) => {
    setItemForm((prev) => {
      const next = { ...prev, [field]: value } as LedgerItemForm;
      if (field === "quantity" || field === "unitPrice") {
        next.quantity = Number(next.quantity) || 0;
        next.unitPrice = Number(next.unitPrice) || 0;
      }
      return next;
    });
  };

  const saveItem = () => {
    if (!itemForm.serviceName.trim()) {
      toast.error("请输入服务名称");
      return;
    }
    if (!itemForm.quantity || itemForm.quantity < 1) {
      toast.error("数量至少为1");
      return;
    }
    if (itemForm.unitPrice < 0) {
      toast.error("单价不能为负数");
      return;
    }
    const normalized: LedgerItemForm = {
      serviceName: itemForm.serviceName.trim(),
      workerType: itemForm.workerType,
      unitPrice: itemForm.unitPrice,
      quantity: itemForm.quantity,
    };
    if (editingItemIndex !== null) {
      setItems((prev) =>
        prev.map((it, i) => (i === editingItemIndex ? normalized : it))
      );
    } else {
      setItems((prev) => [...prev, normalized]);
    }
    setItemSheetOpen(false);
  };

  const handleDragStart = (idx: number) => {
    setDragIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) return;
    setHoverIndex(idx);
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === targetIdx) {
      setDragIndex(null);
      setHoverIndex(null);
      return;
    }
    setItems((prev) => {
      const newItems = [...prev];
      const [removed] = newItems.splice(dragIndex, 1);
      const insertIdx = dragIndex < targetIdx ? targetIdx : targetIdx;
      newItems.splice(insertIdx, 0, removed);
      return newItems;
    });
    setDragIndex(null);
    setHoverIndex(null);
  };

  const handleSave = async () => {
    if (!locked) {
      toast.error("请先锁定日期和项目");
      return;
    }
    if (!recordDate || !projectId) {
      toast.error("日期和项目不能为空");
      return;
    }
    if (items.length === 0) {
      toast.error("请至少添加一条用工记录");
      return;
    }
    const payload = {
      projectId,
      recordDate,
      items: items.map((it) => ({
        serviceName: it.serviceName,
        workerType: it.workerType,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      })),
    };
    try {
      setLoading(true);
      if (editingId) {
        await updateLedger(editingId, payload);
        toast.success("台账修改成功");
      } else {
        await createLedger(payload);
        toast.success("台账新增成功");
      }
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "保存失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent
          showCloseButton={false}
          className="rounded-2xl max-w-2xl max-h-[92vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="text-lg">
              {editingId ? "编辑台账记录" : "新增台账记录"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 日期 */}
            <div className="space-y-1.5">
              <Label>日期 <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={recordDate}
                disabled={locked}
                onChange={(e) => setRecordDate(e.target.value)}
                className="rounded-lg"
              />
            </div>

            {/* 项目 */}
            <div className="space-y-1.5 relative">
              <Label>项目 <span className="text-red-500">*</span></Label>
              <Input
                ref={projectInputRef}
                value={locked ? selectedProjectName : projectFilter}
                disabled={locked}
                onChange={(e) => {
                  setProjectFilter(e.target.value);
                  setProjectId(null);
                  setProjectDropdownOpen(true);
                }}
                onFocus={() => setProjectDropdownOpen(true)}
                placeholder="输入项目名称筛选"
                className="rounded-lg"
              />
              {projectDropdownOpen && !locked && (
                <div
                  ref={projectDropdownRef}
                  className="absolute z-50 left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg"
                >
                  {filteredProjects.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      无匹配项目
                    </div>
                  ) : (
                    filteredProjects.map((p) => (
                      <div
                        key={p.id}
                        className="px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                        onClick={() => {
                          setProjectId(p.id);
                          setProjectFilter(p.projectName);
                          setProjectDropdownOpen(false);
                        }}
                      >
                        {p.projectName}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* 锁定 / 取消锁定 */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant={locked ? "secondary" : "outline"}
                className="rounded-lg"
                disabled={locked || !canLock}
                onClick={handleLock}
              >
                <Lock className="w-4 h-4 mr-1" />
                锁定
              </Button>
              <Button
                type="button"
                variant={locked ? "outline" : "secondary"}
                className="rounded-lg"
                disabled={!locked}
                onClick={handleUnlock}
              >
                <LockOpen className="w-4 h-4 mr-1" />
                取消锁定
              </Button>
            </div>

            {/* 用工记录 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>用工记录</Label>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-lg bg-green-600 hover:bg-green-700"
                  disabled={!locked}
                  onClick={openAddItem}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  新增用工记录
                </Button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground bg-muted/30 rounded-xl">
                  {locked ? "请点击右上角添加用工记录" : "请先锁定日期和项目"}
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      draggable={locked}
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={(e) => handleDrop(e, idx)}
                      className={`flex items-center gap-2 rounded-xl border border-border p-3 transition-colors ${
                        locked ? "cursor-move hover:bg-muted/20" : ""
                      } ${hoverIndex === idx ? "border-green-500 bg-green-50/30" : ""}`}
                    >
                      {locked && <GripVertical className="w-4 h-4 text-muted-foreground" />}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="text-sm font-medium truncate">
                          {item.serviceName}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 rounded">
                            {item.workerType === null
                              ? "未选择"
                              : item.workerType === 2
                              ? "女工"
                              : "男工"}
                          </Badge>
                          <span>{item.quantity} × ¥{item.unitPrice.toFixed(2)}</span>
                          <span className="font-medium text-foreground">
                            = ¥{calcTotalPrice(item.quantity, item.unitPrice).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          disabled={!locked}
                          onClick={() => openEditItem(idx)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={!locked}
                          onClick={() => removeItem(idx)}
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

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-lg"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button
              className="rounded-lg bg-green-600 hover:bg-green-700"
              disabled={!locked || loading}
              onClick={handleSave}
            >
              {loading ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 用工记录 Sheet */}
      <Sheet open={itemSheetOpen} onOpenChange={setItemSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md rounded-l-2xl">
          <SheetHeader className="px-6">
            <SheetTitle className="text-lg">
              {editingItemIndex !== null ? "修改用工记录" : "新增用工记录"}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4 px-6">
            <div className="space-y-1.5">
              <Label>项目常用服务</Label>
              <select
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    const selected = projectCommonServices.find(
                      (s) => s.serviceName === val
                    );
                    if (selected) {
                      setItemForm((prev) => ({
                        ...prev,
                        serviceName: selected.serviceName,
                        workerType: selected.workerType,
                        unitPrice: selected.unitPrice,
                      }));
                    }
                  }
                }}
              >
                <option value="">选择项目常用服务</option>
                {projectCommonServices.map((s) => (
                  <option key={s.id} value={s.serviceName}>
                    {s.serviceName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>服务名称 <span className="text-red-500">*</span></Label>
              <Input
                value={itemForm.serviceName}
                onChange={(e) =>
                  handleItemFieldChange("serviceName", e.target.value)
                }
                className="rounded-lg"
                placeholder="服务名称"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>类型</Label>
                <select
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                  value={itemForm.workerType ?? ""}
                  onChange={(e) =>
                    handleItemFieldChange(
                      "workerType",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
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
                  value={itemForm.quantity}
                  onChange={(e) =>
                    handleItemFieldChange("quantity", Number(e.target.value))
                  }
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
                  value={itemForm.unitPrice}
                  onChange={(e) =>
                    handleItemFieldChange("unitPrice", Number(e.target.value))
                  }
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label>总价</Label>
                <div className="h-10 flex items-center text-base font-bold">
                  ¥{calcTotalPrice(itemForm.quantity, itemForm.unitPrice).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
          <SheetFooter className="px-6">
            <Button
              variant="outline"
              className="rounded-lg"
              onClick={() => setItemSheetOpen(false)}
            >
              取消
            </Button>
            <Button
              className="rounded-lg bg-green-600 hover:bg-green-700"
              onClick={saveItem}
            >
              确定
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
