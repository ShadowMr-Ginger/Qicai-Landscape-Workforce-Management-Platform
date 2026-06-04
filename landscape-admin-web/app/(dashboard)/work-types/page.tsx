"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Wrench,
  Shield,
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
import { getWorkTypeList, createWorkType, updateWorkType, deleteWorkType } from "@/lib/api";

interface WorkTypeItem {
  id: number;
  typeName: string;
  description: string;
  isSystem: number;
  isActive: number;
}

export default function WorkTypesPage() {
  const [items, setItems] = useState<WorkTypeItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ typeName: "", description: "" });
  const [editForm, setEditForm] = useState({ typeName: "", description: "" });
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await getWorkTypeList();
      if (res.code === 200 && res.data) {
        setItems(res.data);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "获取作业类型失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreate = async () => {
    if (!createForm.typeName.trim()) {
      toast.error("作业类型名称不能为空");
      return;
    }
    try {
      await createWorkType(createForm);
      toast.success("新增作业类型成功");
      setCreateOpen(false);
      setCreateForm({ typeName: "", description: "" });
      fetchItems();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "新增失败");
    }
  };

  const openEdit = (item: WorkTypeItem) => {
    setSelectedId(item.id);
    setEditForm({ typeName: item.typeName, description: item.description || "" });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedId || !editForm.typeName.trim()) {
      toast.error("名称不能为空");
      return;
    }
    try {
      await updateWorkType(selectedId, editForm);
      toast.success("修改成功");
      setEditOpen(false);
      fetchItems();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "修改失败");
    }
  };

  const handleDelete = async (item: WorkTypeItem) => {
    if (item.isSystem === 1) {
      toast.error("系统预设作业类型不可删除");
      return;
    }
    if (!confirm(`确定删除作业类型「${item.typeName}」吗？关联的考勤记录将迁移到默认类型。`)) return;
    try {
      await deleteWorkType(item.id);
      toast.success("删除成功");
      fetchItems();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "删除失败");
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-800">作业类型管理</h2>
        </div>
        <Button
          variant="default"
          size="sm"
          className="rounded-lg bg-green-600 hover:bg-green-700"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          新增类型
        </Button>
      </div>

      <Card className="border-0 shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="divide-y divide-gray-50">
            {items.length === 0 ? (
              <p className="text-center py-12 text-gray-400 text-sm">暂无作业类型</p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-green-50/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-700 text-sm font-bold">
                      {item.typeName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800">{item.typeName}</p>
                        {item.isSystem === 1 && (
                          <Badge variant="outline" className="rounded-md text-[10px] border-gray-300 text-gray-500">
                            <Shield className="w-3 h-3 mr-0.5" />
                            系统
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{item.description || "暂无描述"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => openEdit(item)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {item.isSystem !== 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(item)}
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

      {/* 新增弹窗 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg">新增作业类型</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>类型名称 <span className="text-red-500">*</span></Label>
              <Input
                value={createForm.typeName}
                onChange={(e) => setCreateForm({ ...createForm, typeName: e.target.value })}
                className="rounded-lg"
                placeholder="例如：种植"
              />
            </div>
            <div className="space-y-1.5">
              <Label>描述</Label>
              <Input
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                className="rounded-lg"
                placeholder="选填"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button className="rounded-lg bg-green-600 hover:bg-green-700" onClick={handleCreate}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 修改弹窗 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg">修改作业类型</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>类型名称 <span className="text-red-500">*</span></Label>
              <Input
                value={editForm.typeName}
                onChange={(e) => setEditForm({ ...editForm, typeName: e.target.value })}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label>描述</Label>
              <Input
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
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
    </div>
  );
}
