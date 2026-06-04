"use client";

import { useEffect, useState } from "react";
import {
  Users,
  FolderOpen,
  Pencil,
  UserX,
  UserCheck,
  Trash2,
  X,
  AlertTriangle,
  ArrowRightLeft,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getGroupList,
  getGroupWorkers,
  createGroup,
  updateGroup,
  deleteGroup,
  resignAllWorkers,
  restoreAllWorkers,
} from "@/lib/api";
import { cn } from "@/lib/utils";

interface GroupItem {
  id: number;
  groupName: string;
  description: string;
  isSystem: number;
  workerCount: number;
  resignedWorkerCount: number;
}

interface GroupWorker {
  id: number;
  name: string;
  genderText: string;
  phone: string;
  baseDailySalary: number;
  overtimeHourlyRate: number;
  isEmployed: number;
  isEmployedText: string;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [managing, setManaging] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupItem | null>(null);
  const [groupWorkers, setGroupWorkers] = useState<GroupWorker[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ groupName: "", description: "" });
  const [editForm, setEditForm] = useState({ groupName: "", description: "" });

  const [resignOpen, setResignOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteWorkers, setDeleteWorkers] = useState<GroupWorker[]>([]);
  const [migrateTargetId, setMigrateTargetId] = useState("");

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await getGroupList();
      if (res.code === 200 && res.data) {
        setGroups(res.data);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "获取组别列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const openDetail = async (group: GroupItem) => {
    setSelectedGroup(group);
    try {
      const res = await getGroupWorkers(group.id);
      if (res.code === 200 && res.data) {
        setGroupWorkers(res.data);
      }
    } catch {
      setGroupWorkers([]);
    }
    setDetailOpen(true);
  };

  const handleCreateSave = async () => {
    if (!createForm.groupName.trim()) {
      toast.error("组别名称不能为空");
      return;
    }
    try {
      await createGroup({
        groupName: createForm.groupName,
        description: createForm.description,
      });
      toast.success("新增组别成功");
      setCreateOpen(false);
      setCreateForm({ groupName: "", description: "" });
      fetchGroups();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "新增失败");
    }
  };

  const openEdit = (group: GroupItem) => {
    setSelectedGroup(group);
    setEditForm({ groupName: group.groupName, description: group.description || "" });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!selectedGroup) return;
    if (!editForm.groupName.trim()) {
      toast.error("组别名称不能为空");
      return;
    }
    try {
      await updateGroup(selectedGroup.id, {
        groupName: editForm.groupName,
        description: editForm.description,
      });
      toast.success("修改成功");
      setEditOpen(false);
      fetchGroups();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "修改失败");
    }
  };

  const openResign = (group: GroupItem) => {
    setSelectedGroup(group);
    setResignOpen(true);
  };

  const handleResignAll = async () => {
    if (!selectedGroup) return;
    try {
      const res = await resignAllWorkers(selectedGroup.id);
      toast.success(`已将 ${res.data?.affectedCount || 0} 名工人设为离职`);
      setResignOpen(false);
      fetchGroups();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "操作失败");
    }
  };

  const openRestore = (group: GroupItem) => {
    setSelectedGroup(group);
    setRestoreOpen(true);
  };

  const handleRestoreAll = async () => {
    if (!selectedGroup) return;
    try {
      const res = await restoreAllWorkers(selectedGroup.id);
      toast.success(`已将 ${res.data?.affectedCount || 0} 名工人恢复为在职`);
      setRestoreOpen(false);
      fetchGroups();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "操作失败");
    }
  };

  const openDelete = async (group: GroupItem) => {
    setSelectedGroup(group);
    try {
      const res = await getGroupWorkers(group.id);
      if (res.code === 200 && res.data) {
        setDeleteWorkers(res.data);
      }
    } catch {
      setDeleteWorkers([]);
    }
    const unassigned = groups.find((g) => g.groupName === "未分配");
    setMigrateTargetId(unassigned ? String(unassigned.id) : "");
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedGroup) return;
    const targetId = Number(migrateTargetId);
    if (!targetId || targetId === selectedGroup.id) {
      toast.error("请选择有效的迁移目标组别");
      return;
    }
    try {
      await deleteGroup(selectedGroup.id, targetId);
      toast.success("删除成功，工人已迁移");
      setDeleteOpen(false);
      fetchGroups();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "删除失败");
    }
  };

  return (
    <div className="space-y-4">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-800">组别管理</h2>
          <Badge variant="secondary" className="rounded-md">
            {groups.length} 个组别
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {!managing ? (
            <>
              <Button
                variant="default"
                size="sm"
                className="rounded-lg bg-green-600 hover:bg-green-700"
                onClick={() => setCreateOpen(true)}
              >
                <FolderOpen className="w-4 h-4 mr-1" />
                新增组别
              </Button>
              <Button
                variant="default"
                size="sm"
                className="rounded-lg bg-blue-600 hover:bg-blue-700"
                onClick={() => setManaging(true)}
              >
                <Pencil className="w-4 h-4 mr-1" />
                管理
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => setManaging(false)}
            >
              <X className="w-4 h-4 mr-1" />
              退出管理
            </Button>
          )}
        </div>
      </div>

      {/* 组别卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <Card
            key={group.id}
            className="border-0 shadow-sm rounded-xl cursor-pointer hover:shadow-md hover:bg-green-50/20 transition-all"
            onClick={() => openDetail(group)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-800">{group.groupName}</h3>
                    {group.isSystem === 1 && (
                      <Badge variant="outline" className="text-[10px] rounded-md border-gray-300 text-gray-500">
                        系统
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 truncate">
                    {group.description || "暂无描述"}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Users className="w-4 h-4 text-green-500" />
                      <span>{group.workerCount} 人</span>
                    </div>
                    {group.resignedWorkerCount > 0 && (
                      <div className="flex items-center gap-1 text-sm text-orange-600">
                        <UserX className="w-4 h-4" />
                        <span>{group.resignedWorkerCount} 已离职</span>
                      </div>
                    )}
                  </div>
                </div>
                {managing && group.isSystem !== 1 && (
                  <div className="flex flex-col gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 rounded-lg text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      onClick={(e) => { e.stopPropagation(); openResign(group); }}
                      title="组别离职"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={(e) => { e.stopPropagation(); openRestore(group); }}
                      title="组别恢复"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => { e.stopPropagation(); openDelete(group); }}
                      title="组别删除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
                {managing && group.isSystem === 1 && (
                  <div className="ml-2 text-[10px] text-gray-400 leading-tight">
                    不可<br/>删除
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 组内工人详情 Drawer */}
      <Drawer open={detailOpen} onOpenChange={setDetailOpen}>
        <DrawerContent className="rounded-t-2xl max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="text-lg flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-green-600" />
              {selectedGroup?.groupName}
              <Badge variant="secondary" className="rounded-md text-xs">
                {groupWorkers.length} 人
              </Badge>
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-2 space-y-2 max-w-lg mx-auto w-full overflow-y-auto">
            {groupWorkers.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                该组暂无工人
              </div>
            ) : (
              groupWorkers.map((worker) => (
                <div
                  key={worker.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl text-sm",
                    worker.isEmployed === 0 ? "bg-gray-50" : "bg-green-50/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                      worker.isEmployed === 0 ? "bg-gray-200 text-gray-500" : "bg-green-100 text-green-700"
                    )}>
                      {worker.name.charAt(0)}
                    </div>
                    <div>
                      <p className={cn(
                        "font-medium",
                        worker.isEmployed === 0 ? "text-gray-400 line-through" : "text-gray-800"
                      )}>
                        {worker.name}
                        {worker.isEmployed === 0 && (
                          <span className="text-orange-500 text-xs ml-1">（已离职）</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">
                        {worker.genderText} · {worker.phone || "无手机号"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>日薪 ¥{worker.baseDailySalary}</p>
                    <p>加班 ¥{worker.overtimeHourlyRate}/h</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <DrawerFooter>
            <Button className="rounded-xl w-full" variant="outline" onClick={() => setDetailOpen(false)}>
              关闭
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* 新增组别 Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">新增组别</DialogTitle>
            <DialogDescription>填写组别信息后点击保存</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>组别名称 <span className="text-red-500">*</span></Label>
              <Input
                value={createForm.groupName}
                onChange={(e) => setCreateForm({ ...createForm, groupName: e.target.value })}
                className="rounded-lg"
                placeholder="例如：技术组"
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
            <Button className="rounded-lg bg-green-600 hover:bg-green-700" onClick={handleCreateSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 修改组别 Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">修改组别</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>组别名称 <span className="text-red-500">*</span></Label>
              <Input
                value={editForm.groupName}
                onChange={(e) => setEditForm({ ...editForm, groupName: e.target.value })}
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
            <Button className="rounded-lg bg-green-600 hover:bg-green-700" onClick={handleEditSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 组别离职 Dialog */}
      <Dialog open={resignOpen} onOpenChange={setResignOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              确认组别离职
            </DialogTitle>
            <DialogDescription>
              确定要将 <strong>{selectedGroup?.groupName}</strong> 组内所有未离职的工人设为离职状态吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setResignOpen(false)}>取消</Button>
            <Button className="rounded-lg bg-orange-600 hover:bg-orange-700" onClick={handleResignAll}>确认离职</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 组别恢复 Dialog */}
      <Dialog open={restoreOpen} onOpenChange={setRestoreOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <UserCheck className="w-5 h-5" />
              确认组别恢复
            </DialogTitle>
            <DialogDescription>
              确定要将 <strong>{selectedGroup?.groupName}</strong> 组内所有已离职的工人恢复为在职状态吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setRestoreOpen(false)}>取消</Button>
            <Button className="rounded-lg bg-green-600 hover:bg-green-700" onClick={handleRestoreAll}>确认恢复</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 组别删除 + 迁移 Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-2xl max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ArrowRightLeft className="w-5 h-5" />
              删除组别并迁移工人
            </DialogTitle>
            <DialogDescription>
              删除 <strong>{selectedGroup?.groupName}</strong> 前，请将该组所有工人迁移到其他组别。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>迁移到组别 <span className="text-red-500">*</span></Label>
              <select
                value={migrateTargetId}
                onChange={(e) => setMigrateTargetId(e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">请选择目标组别</option>
                {groups
                  .filter((g) => g.id !== selectedGroup?.id)
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.groupName} {g.isSystem === 1 ? "(系统)" : ""}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-gray-400">默认迁移到"未分配"组</p>
            </div>

            <div className="space-y-1.5">
              <Label>该组工人列表（{deleteWorkers.length} 人）</Label>
              <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-gray-100 p-2">
                {deleteWorkers.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-2">该组暂无工人</p>
                ) : (
                  deleteWorkers.map((w) => (
                    <div
                      key={w.id}
                      className={cn(
                        "flex items-center justify-between px-2 py-1.5 rounded-lg text-sm",
                        w.isEmployed === 0 ? "bg-gray-50 text-gray-400" : "bg-green-50/30 text-gray-700"
                      )}
                    >
                      <span className="flex items-center gap-1">
                        {w.name}
                        {w.isEmployed === 0 && (
                          <span className="text-orange-500 text-xs">（已离职）</span>
                        )}
                      </span>
                      <span className="text-xs text-gray-400">{w.phone || "无手机号"}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setDeleteOpen(false)}>取消</Button>
            <Button variant="destructive" className="rounded-lg" onClick={handleDelete}>确认删除并迁移</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
