"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getCommonServiceNames,
  createCommonServiceName,
  updateCommonServiceName,
  deleteCommonServiceName,
} from "@/lib/api";

interface ServiceNameItem {
  id: number;
  serviceName: string;
  basePrice?: number;
  isSystem: number;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const res = (err as { response?: { data?: { message?: string } } }).response;
    if (res?.data?.message) return res.data.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export default function ServiceItemManager() {
  const [items, setItems] = useState<ServiceNameItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createPrice, setCreatePrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editItem, setEditItem] = useState<ServiceNameItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCommonServiceNames();
      setItems(res.data || []);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "加载常用服务名称失败"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadItems();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadItems]);

  async function handleCreate() {
    const name = createName.trim();
    if (!name) {
      toast.error("请输入服务名称");
      return;
    }
    setSubmitting(true);
    try {
      const price = createPrice.trim() ? Number(createPrice) : undefined;
      await createCommonServiceName(name, price);
      toast.success("新增成功");
      setCreateOpen(false);
      setCreateName("");
      setCreatePrice("");
      await loadItems();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "新增失败"));
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(item: ServiceNameItem) {
    if (item.isSystem === 1) return;
    setEditItem(item);
    setEditName(item.serviceName);
    setEditPrice(item.basePrice?.toString() ?? "");
  }

  async function handleUpdate() {
    if (!editItem) return;
    const name = editName.trim();
    if (!name) {
      toast.error("请输入服务名称");
      return;
    }
    setSubmitting(true);
    try {
      const price = editPrice.trim() ? Number(editPrice) : undefined;
      await updateCommonServiceName(editItem.id, name, price);
      toast.success("修改成功");
      setEditItem(null);
      await loadItems();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "修改失败"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item: ServiceNameItem) {
    if (!confirm(`确定删除常用服务名称「${item.serviceName}」吗？`)) return;
    try {
      await deleteCommonServiceName(item.id);
      toast.success("删除成功");
      await loadItems();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "删除失败"));
    }
  }

  return (
    <Card className="border-0 shadow-sm rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">常用服务名称</CardTitle>
        <Button
          size="sm"
          className="rounded-lg bg-green-600 hover:bg-green-700"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          新增
        </Button>
      </CardHeader>
      <CardContent>
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            加载中...
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            暂无常用服务名称，点击右上角新增。
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {item.serviceName}
                    </span>
                    {item.isSystem === 1 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                        系统
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    基础价格：{item.basePrice !== undefined ? `¥${item.basePrice.toFixed(2)}` : "未设置"}
                  </span>
                </div>
                {item.isSystem !== 1 && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => openEdit(item)}
                      title="修改"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(item)}
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg">新增常用服务名称</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>
                服务名称 <span className="text-red-500">*</span>
              </Label>
              <Input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="例如：绿化养护"
                className="rounded-lg"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>基础价格</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={createPrice}
                onChange={(e) => setCreatePrice(e.target.value)}
                placeholder="选填，用于自动填充单价"
                className="rounded-lg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-lg"
              onClick={() => setCreateOpen(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button
              className="rounded-lg bg-green-600 hover:bg-green-700"
              onClick={handleCreate}
              disabled={submitting}
            >
              {submitting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg">修改常用服务</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>
                服务名称 <span className="text-red-500">*</span>
              </Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="例如：绿化养护"
                className="rounded-lg"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdate();
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>基础价格</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                placeholder="选填，用于自动填充单价"
                className="rounded-lg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-lg"
              onClick={() => setEditItem(null)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button
              className="rounded-lg bg-green-600 hover:bg-green-700"
              onClick={handleUpdate}
              disabled={submitting}
            >
              {submitting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
