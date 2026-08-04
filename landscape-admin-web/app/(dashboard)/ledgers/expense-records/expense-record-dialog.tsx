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
  X,
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
import {
  createExpenseRecord,
  updateExpenseRecord,
  getExpenseRecordDetail,
  getExpenseItemCommonSubjects,
  getExpenseItemCommonRemarks,
} from "@/lib/api";

export interface ExpenseItemOption {
  id: number;
  itemName: string;
  projectId?: number;
}

interface ExpenseItemForm {
  subjectName: string;
  quantity: number;
  unitPrice: number;
  remark: string;
}

interface ExpenseRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingId?: number | null;
  expenseItems: ExpenseItemOption[];
}

function getToday(): string {
  const now = new Date();
  const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return chinaTime.toISOString().split("T")[0];
}

function calcTotalPrice(qty: number, price: number) {
  return Math.round(qty * price * 100) / 100;
}

export default function ExpenseRecordDialog({
  open,
  onOpenChange,
  onSuccess,
  editingId,
  expenseItems,
}: ExpenseRecordDialogProps) {
  const [recordDate, setRecordDate] = useState(getToday());
  const [expenseItemId, setExpenseItemId] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [items, setItems] = useState<ExpenseItemForm[]>([]);
  const [loading, setLoading] = useState(false);

  const [itemFilter, setItemFilter] = useState("");
  const [itemDropdownOpen, setItemDropdownOpen] = useState(false);
  const itemInputRef = useRef<HTMLInputElement>(null);
  const itemDropdownRef = useRef<HTMLDivElement>(null);

  const [commonSubjects, setCommonSubjects] = useState<{ id: number; subjectName: string }[]>([]);
  const [commonRemarks, setCommonRemarks] = useState<{ id: number; remarkName: string }[]>([]);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const subjectDropdownRef = useRef<HTMLDivElement>(null);

  const [remarkFilter, setRemarkFilter] = useState("");
  const [remarkDropdownOpen, setRemarkDropdownOpen] = useState(false);
  const remarkInputRef = useRef<HTMLInputElement>(null);
  const remarkDropdownRef = useRef<HTMLDivElement>(null);

  const [itemSheetOpen, setItemSheetOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState<ExpenseItemForm>({
    subjectName: "",
    quantity: 1,
    unitPrice: 0,
    remark: "",
  });

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // 打开用工记录面板时同步筛选
  useEffect(() => {
    if (itemSheetOpen) {
      setSubjectFilter(itemForm.subjectName);
      setRemarkFilter(itemForm.remark);
    }
  }, [itemSheetOpen, itemForm.subjectName, itemForm.remark]);

  // 点击外部关闭下拉
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        itemDropdownRef.current &&
        !itemDropdownRef.current.contains(e.target as Node) &&
        itemInputRef.current &&
        !itemInputRef.current.contains(e.target as Node)
      ) {
        setItemDropdownOpen(false);
      }
      if (
        subjectDropdownRef.current &&
        !subjectDropdownRef.current.contains(e.target as Node) &&
        subjectInputRef.current &&
        !subjectInputRef.current.contains(e.target as Node)
      ) {
        setSubjectDropdownOpen(false);
      }
      if (
        remarkDropdownRef.current &&
        !remarkDropdownRef.current.contains(e.target as Node) &&
        remarkInputRef.current &&
        !remarkInputRef.current.contains(e.target as Node)
      ) {
        setRemarkDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 打开时初始化
  useEffect(() => {
    if (!open) return;
    setItemFilter("");
    setItemDropdownOpen(false);
    if (editingId) {
      loadDetail(editingId);
    } else {
      setRecordDate(getToday());
      setExpenseItemId(null);
      setLocked(false);
      setItems([]);
      setCommonSubjects([]);
      setCommonRemarks([]);
    }
  }, [open, editingId]);

  // 锁定后加载常用主体和常用备注
  useEffect(() => {
    if (locked && expenseItemId) {
      fetchCommonSubjects(expenseItemId);
      fetchCommonRemarks(expenseItemId);
    } else {
      setCommonSubjects([]);
      setCommonRemarks([]);
    }
  }, [locked, expenseItemId]);

  const loadDetail = async (id: number) => {
    try {
      setLoading(true);
      const res = await getExpenseRecordDetail(id);
      if (res.code === 200 && res.data) {
        const data = res.data;
        setRecordDate(data.recordDate);
        setExpenseItemId(data.expenseItemId);
        setLocked(true);
        setItems(
          (data.items || []).map((it: any) => ({
            subjectName: it.subjectName,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            remark: it.remark || "",
          }))
        );
        const item = expenseItems.find((p) => p.id === data.expenseItemId);
        if (item) setItemFilter(item.itemName);
      } else {
        toast.error(res.message || "加载失败");
      }
    } catch {
      toast.error("加载开销记录失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchCommonSubjects = async (id: number) => {
    try {
      const res = await getExpenseItemCommonSubjects(id);
      if (res.code === 200 && res.data) {
        setCommonSubjects(res.data);
      }
    } catch {
      // ignore
    }
  };

  const fetchCommonRemarks = async (id: number) => {
    try {
      const res = await getExpenseItemCommonRemarks(id);
      if (res.code === 200 && res.data) {
        setCommonRemarks(res.data);
      }
    } catch {
      // ignore
    }
  };

  const filteredItems = expenseItems.filter((p) =>
    p.itemName.toLowerCase().includes(itemFilter.trim().toLowerCase())
  );

  const selectedItemName =
    expenseItems.find((p) => p.id === expenseItemId)?.itemName || "";

  const selectedProjectId =
    expenseItems.find((p) => p.id === expenseItemId)?.projectId;

  const canLock = recordDate && expenseItemId;

  const handleLock = () => {
    if (!recordDate || !expenseItemId) {
      toast.error("请先选择日期和开支项目");
      return;
    }
    setLocked(true);
  };

  const handleUnlock = () => {
    setLocked(false);
  };

  const openAddItem = () => {
    setEditingItemIndex(null);
    setItemForm({ subjectName: "", quantity: 1, unitPrice: 0, remark: "" });
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
    field: keyof ExpenseItemForm,
    value: string | number
  ) => {
    setItemForm((prev) => {
      const next = { ...prev, [field]: value } as ExpenseItemForm;
      if (field === "quantity" || field === "unitPrice") {
        next.quantity = Number(next.quantity) || 0;
        next.unitPrice = Number(next.unitPrice) || 0;
      }
      return next;
    });
  };

  const clearSubjectName = () => {
    setSubjectFilter("");
    handleItemFieldChange("subjectName", "");
  };

  const clearRemark = () => {
    setRemarkFilter("");
    handleItemFieldChange("remark", "");
  };

  const saveItem = () => {
    if (!itemForm.subjectName.trim()) {
      toast.error("请输入主体名字");
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
    const normalized: ExpenseItemForm = {
      subjectName: itemForm.subjectName.trim(),
      quantity: itemForm.quantity,
      unitPrice: itemForm.unitPrice,
      remark: itemForm.remark.trim(),
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
      newItems.splice(targetIdx, 0, removed);
      return newItems;
    });
    setDragIndex(null);
    setHoverIndex(null);
  };

  const handleSave = async () => {
    if (!locked) {
      toast.error("请先锁定日期和开支项目");
      return;
    }
    if (!recordDate || !expenseItemId) {
      toast.error("日期、开支项目不能为空");
      return;
    }
    if (items.length === 0) {
      toast.error("请至少添加一条单项开支");
      return;
    }
    const payload: any = {
      expenseItemId,
      recordDate,
      items: items.map((it) => ({
        subjectName: it.subjectName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        remark: it.remark,
      })),
    };
    if (selectedProjectId) {
      payload.projectId = selectedProjectId;
    }
    try {
      setLoading(true);
      if (editingId) {
        await updateExpenseRecord(editingId, payload);
        toast.success("开销记录修改成功");
      } else {
        await createExpenseRecord(payload);
        toast.success("开销记录新增成功");
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
              {editingId ? "编辑开销记录" : "新增开销记录"}
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

            {/* 开支项目 */}
            <div className="space-y-1.5 relative">
              <Label>项目 <span className="text-red-500">*</span></Label>
              <Input
                ref={itemInputRef}
                value={locked ? selectedItemName : itemFilter}
                disabled={locked}
                onChange={(e) => {
                  setItemFilter(e.target.value);
                  setExpenseItemId(null);
                  setItemDropdownOpen(true);
                }}
                onFocus={() => setItemDropdownOpen(true)}
                placeholder="输入项目名称筛选"
                className="rounded-lg"
              />
              {itemDropdownOpen && !locked && (
                <div
                  ref={itemDropdownRef}
                  className="absolute z-50 left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg"
                >
                  {filteredItems.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      无匹配项目
                    </div>
                  ) : (
                    filteredItems.map((p) => (
                      <div
                        key={p.id}
                        className="px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                        onClick={() => {
                          setExpenseItemId(p.id);
                          setItemFilter(p.itemName);
                          setItemDropdownOpen(false);
                        }}
                      >
                        {p.itemName}
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

            {/* 单项开支 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>单项开支</Label>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-lg bg-green-600 hover:bg-green-700"
                  disabled={!locked}
                  onClick={openAddItem}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  新增单项开支
                </Button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground bg-muted/30 rounded-xl">
                  {locked ? "请点击右上角添加单项开支" : "请先锁定日期和项目"}
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
                          {item.subjectName}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span>{item.quantity} × ¥{item.unitPrice.toFixed(2)}</span>
                          <span className="font-medium text-foreground">
                            = ¥{calcTotalPrice(item.quantity, item.unitPrice).toFixed(2)}
                          </span>
                        </div>
                        {item.remark && (
                          <div className="text-xs text-muted-foreground truncate">
                            备注：{item.remark}
                          </div>
                        )}
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

      {/* 单项开支 Sheet */}
      <Sheet open={itemSheetOpen} onOpenChange={setItemSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md rounded-l-2xl">
          <SheetHeader className="px-6">
            <SheetTitle className="text-lg">
              {editingItemIndex !== null ? "修改单项开支" : "新增单项开支"}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4 px-6">
            <div className="space-y-1.5 relative">
              <Label>主体名字 <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  ref={subjectInputRef}
                  value={itemForm.subjectName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSubjectFilter(val);
                    handleItemFieldChange("subjectName", val);
                    setSubjectDropdownOpen(true);
                  }}
                  onFocus={() => setSubjectDropdownOpen(true)}
                  className="rounded-lg pr-9"
                  placeholder="主体名字"
                />
                {itemForm.subjectName && (
                  <button
                    type="button"
                    onClick={clearSubjectName}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {subjectDropdownOpen && (
                <div
                  ref={subjectDropdownRef}
                  className="absolute z-50 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg"
                >
                  {commonSubjects.filter((s) =>
                    s.subjectName.toLowerCase().includes(subjectFilter.trim().toLowerCase())
                  ).length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      {subjectFilter.trim() ? "无匹配主体" : "暂无常用主体"}
                    </div>
                  ) : (
                    commonSubjects
                      .filter((s) =>
                        s.subjectName.toLowerCase().includes(subjectFilter.trim().toLowerCase())
                      )
                      .map((s) => (
                        <div
                          key={s.id}
                          className="px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                          onClick={() => {
                            setSubjectFilter(s.subjectName);
                            handleItemFieldChange("subjectName", s.subjectName);
                            setSubjectDropdownOpen(false);
                          }}
                        >
                          {s.subjectName}
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
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
            </div>

            <div className="space-y-1.5">
              <Label>总价</Label>
              <div className="h-10 flex items-center text-base font-bold">
                ¥{calcTotalPrice(itemForm.quantity, itemForm.unitPrice).toFixed(2)}
              </div>
            </div>

            <div className="space-y-1.5 relative">
              <Label>备注</Label>
              <div className="relative">
                <Input
                  ref={remarkInputRef}
                  value={itemForm.remark}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRemarkFilter(val);
                    handleItemFieldChange("remark", val);
                    setRemarkDropdownOpen(true);
                  }}
                  onFocus={() => setRemarkDropdownOpen(true)}
                  className="rounded-lg pr-9"
                  placeholder="选填"
                />
                {itemForm.remark && (
                  <button
                    type="button"
                    onClick={clearRemark}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {remarkDropdownOpen && (
                <div
                  ref={remarkDropdownRef}
                  className="absolute z-50 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg"
                >
                  {commonRemarks.filter((r) =>
                    r.remarkName.toLowerCase().includes(remarkFilter.trim().toLowerCase())
                  ).length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      {remarkFilter.trim() ? "无匹配备注" : "暂无常用备注"}
                    </div>
                  ) : (
                    commonRemarks
                      .filter((r) =>
                        r.remarkName.toLowerCase().includes(remarkFilter.trim().toLowerCase())
                      )
                      .map((r) => (
                        <div
                          key={r.id}
                          className="px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                          onClick={() => {
                            setRemarkFilter(r.remarkName);
                            handleItemFieldChange("remark", r.remarkName);
                            setRemarkDropdownOpen(false);
                          }}
                        >
                          {r.remarkName}
                        </div>
                      ))
                  )}
                </div>
              )}
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
