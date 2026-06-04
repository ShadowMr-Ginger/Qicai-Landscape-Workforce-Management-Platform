"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  Search,
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
} from "@/lib/api";

interface ProjectItem {
  id: number;
  projectName: string;
  projectAddress: string;
  startDate: string;
  endDate: string;
  status: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    projectName: "",
    projectAddress: "",
    startDate: "",
    endDate: "",
  });
  const [editForm, setEditForm] = useState({
    projectName: "",
    projectAddress: "",
    startDate: "",
    endDate: "",
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);

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

  const handleCreate = async () => {
    if (!createForm.projectName.trim()) {
      toast.error("项目名称不能为空");
      return;
    }
    try {
      await createProject(createForm);
      toast.success("新增项目成功");
      setCreateOpen(false);
      setCreateForm({ projectName: "", projectAddress: "", startDate: "", endDate: "" });
      fetchProjects();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "新增失败");
    }
  };

  const openEdit = (item: ProjectItem) => {
    setSelectedId(item.id);
    setEditForm({
      projectName: item.projectName,
      projectAddress: item.projectAddress || "",
      startDate: item.startDate || "",
      endDate: item.endDate || "",
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedId || !editForm.projectName.trim()) {
      toast.error("项目名称不能为空");
      return;
    }
    try {
      await updateProject(selectedId, editForm);
      toast.success("修改成功");
      setEditOpen(false);
      fetchProjects();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "修改失败");
    }
  };

  const handleDelete = async (item: ProjectItem) => {
    if (!confirm(`确定删除项目「${item.projectName}」吗？`)) return;
    try {
      await deleteProject(item.id);
      toast.success("删除成功");
      fetchProjects();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "删除失败");
    }
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-800">项目管理</h2>
        </div>
        <Button
          variant="default"
          size="sm"
          className="rounded-lg bg-green-600 hover:bg-green-700"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          新增项目
        </Button>
      </div>

      {/* 搜索 */}
      <Card className="border-0 shadow-sm rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索项目名称"
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
              <p className="text-center py-12 text-gray-400 text-sm">暂无项目</p>
            ) : (
              projects.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-green-50/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-700 text-sm font-bold">
                      {item.projectName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800">{item.projectName}</p>
                        <Badge variant="outline" className="rounded-md text-[10px] border-green-200 text-green-600 bg-green-50">
                          {item.status === 1 ? "进行中" : "已结束"}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400">
                        {item.projectAddress || "暂无地址"}
                        {item.startDate ? ` · ${item.startDate}` : ""}
                        {item.endDate ? ` ~ ${item.endDate}` : ""}
                      </p>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(item)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
            <DialogTitle className="text-lg">新增项目</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>项目名称 <span className="text-red-500">*</span></Label>
              <Input
                value={createForm.projectName}
                onChange={(e) => setCreateForm({ ...createForm, projectName: e.target.value })}
                className="rounded-lg"
                placeholder="例如：道路养护"
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

      {/* 修改弹窗 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg">修改项目</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>项目名称 <span className="text-red-500">*</span></Label>
              <Input
                value={editForm.projectName}
                onChange={(e) => setEditForm({ ...editForm, projectName: e.target.value })}
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
    </div>
  );
}
