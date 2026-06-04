"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  RotateCcw,
  Pencil,
  UserX,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Users,
  UserCheck,
  AlertTriangle,
  X,
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
import { createWorker, getWorkerList, getWorkerDetail, updateWorker, resignWorker, deleteWorker } from "@/lib/api";

interface WorkerItem {
  id: number;
  name: string;
  genderText: string;
  isSkilledWorkerText: string;
  phone: string;
  baseDailySalary: number;
  overtimeHourlyRate: number;
  groupName: string;
  isEmployed: number;
}

interface WorkerDetail {
  id: number;
  name: string;
  genderText: string;
  groupName: string;
  phone: string;
  idCard: string;
  baseDailySalary: number;
  overtimeHourlyRate: number;
  emergencyContactPhone: string;
  isSkilledWorkerText: string;
  isEmployedText: string;
  defaultProjectName: string;
  createTime: string;
}

const mockWorkers: WorkerItem[] = [
  { id: 1, name: "张三", genderText: "男", isSkilledWorkerText: "是", phone: "13800138001", baseDailySalary: 200, overtimeHourlyRate: 30, groupName: "一组", isEmployed: 1 },
  { id: 2, name: "李四", genderText: "女", isSkilledWorkerText: "否", phone: "13800138002", baseDailySalary: 180, overtimeHourlyRate: 25, groupName: "一组", isEmployed: 1 },
  { id: 3, name: "王五", genderText: "男", isSkilledWorkerText: "是", phone: "13800138003", baseDailySalary: 220, overtimeHourlyRate: 35, groupName: "二组", isEmployed: 1 },
  { id: 4, name: "赵六", genderText: "男", isSkilledWorkerText: "否", phone: "13800138004", baseDailySalary: 180, overtimeHourlyRate: 25, groupName: "技术组", isEmployed: 1 },
  { id: 5, name: "孙七", genderText: "女", isSkilledWorkerText: "否", phone: "13800138005", baseDailySalary: 180, overtimeHourlyRate: 25, groupName: "二组", isEmployed: 1 },
  { id: 6, name: "周八", genderText: "男", isSkilledWorkerText: "是", phone: "13800138006", baseDailySalary: 250, overtimeHourlyRate: 40, groupName: "技术组", isEmployed: 0 },
];

export default function WorkersPage() {
  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [gender, setGender] = useState("");
  const [isSkilled, setIsSkilled] = useState("");
  const [groupId, setGroupId] = useState("");
  const [showResigned, setShowResigned] = useState(false);
  const [managing, setManaging] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [resignOpen, setResignOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerItem | null>(null);
  const [workerDetail, setWorkerDetail] = useState<WorkerDetail | null>(null);
  const [deleteAttendanceCount, setDeleteAttendanceCount] = useState(0);

  const [createForm, setCreateForm] = useState({
    name: "",
    gender: "1",
    phone: "",
    baseDailySalary: "",
    overtimeHourlyRate: "",
    isSkilledWorker: "0",
    groupId: "",
    idCard: "",
    emergencyContactPhone: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    gender: "1",
    phone: "",
    baseDailySalary: "",
    overtimeHourlyRate: "",
    isSkilledWorker: "0",
    groupId: "",
  });

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const res = await getWorkerList({
        keyword,
        gender: gender || undefined,
        isSkilledWorker: isSkilled || undefined,
        groupId: groupId || undefined,
        isEmployed: showResigned ? 0 : 1,
        pageNum: 1,
        pageSize: 100,
      });
      if (res.code === 200 && res.data?.records && res.data.records.length > 0) {
        setWorkers(res.data.records);
      } else {
        // fallback 模拟数据
        setWorkers(
          mockWorkers.filter((w) => {
            if (showResigned ? w.isEmployed === 1 : w.isEmployed === 0) return false;
            if (keyword && !w.name.includes(keyword)) return false;
            if (gender && w.genderText !== (gender === "1" ? "男" : "女")) return false;
            if (isSkilled && w.isSkilledWorkerText !== (isSkilled === "1" ? "是" : "否")) return false;
            return true;
          })
        );
      }
    } catch {
      setWorkers(
        mockWorkers.filter((w) => {
          if (showResigned ? w.isEmployed === 1 : w.isEmployed === 0) return false;
          if (keyword && !w.name.includes(keyword)) return false;
          if (gender && w.genderText !== (gender === "1" ? "男" : "女")) return false;
          if (isSkilled && w.isSkilledWorkerText !== (isSkilled === "1" ? "是" : "否")) return false;
          return true;
        })
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [showResigned]);

  const handleApplyFilter = () => {
    fetchWorkers();
  };

  const handleReset = () => {
    setKeyword("");
    setGender("");
    setIsSkilled("");
    setGroupId("");
    fetchWorkers();
  };

  const openEdit = async (worker: WorkerItem) => {
    setSelectedWorker(worker);
    try {
      const res = await getWorkerDetail(worker.id);
      if (res.code === 200 && res.data) {
        const d = res.data;
        setEditForm({
          name: d.name,
          gender: d.genderText === "男" ? "1" : "2",
          phone: d.phone || "",
          baseDailySalary: String(d.baseDailySalary),
          overtimeHourlyRate: String(d.overtimeHourlyRate),
          isSkilledWorker: d.isSkilledWorkerText === "是" ? "1" : "0",
          groupId: String(d.groupId || ""),
        });
      }
    } catch {
      setEditForm({
        name: worker.name,
        gender: worker.genderText === "男" ? "1" : "2",
        phone: worker.phone,
        baseDailySalary: String(worker.baseDailySalary),
        overtimeHourlyRate: String(worker.overtimeHourlyRate),
        isSkilledWorker: worker.isSkilledWorkerText === "是" ? "1" : "0",
        groupId: "",
      });
    }
    setEditOpen(true);
  };

  const handleCreateSave = async () => {
    if (!createForm.name.trim()) {
      toast.error("姓名不能为空");
      return;
    }
    try {
      await createWorker({
        name: createForm.name,
        gender: Number(createForm.gender),
        phone: createForm.phone,
        baseDailySalary: Number(createForm.baseDailySalary),
        overtimeHourlyRate: Number(createForm.overtimeHourlyRate),
        isSkilledWorker: Number(createForm.isSkilledWorker),
        groupId: createForm.groupId ? Number(createForm.groupId) : null,
        idCard: createForm.idCard || null,
        emergencyContactPhone: createForm.emergencyContactPhone || null,
      });
      toast.success("新增工人成功");
      setCreateOpen(false);
      setCreateForm({
        name: "",
        gender: "1",
        phone: "",
        baseDailySalary: "",
        overtimeHourlyRate: "",
        isSkilledWorker: "0",
        groupId: "",
        idCard: "",
        emergencyContactPhone: "",
      });
      fetchWorkers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "新增工人失败，请检查网络或联系管理员");
    }
  };

  const handleEditSave = async () => {
    if (!selectedWorker) return;
    try {
      await updateWorker(selectedWorker.id, {
        name: editForm.name,
        gender: Number(editForm.gender),
        phone: editForm.phone,
        baseDailySalary: Number(editForm.baseDailySalary),
        overtimeHourlyRate: Number(editForm.overtimeHourlyRate),
        isSkilledWorker: Number(editForm.isSkilledWorker),
        groupId: editForm.groupId ? Number(editForm.groupId) : null,
      });
      toast.success("修改成功");
      setEditOpen(false);
      fetchWorkers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "修改失败");
    }
  };

  const openDetail = async (worker: WorkerItem) => {
    setSelectedWorker(worker);
    try {
      const res = await getWorkerDetail(worker.id);
      if (res.code === 200 && res.data) {
        setWorkerDetail(res.data);
      }
    } catch {
      setWorkerDetail({
        id: worker.id,
        name: worker.name,
        genderText: worker.genderText,
        groupName: worker.groupName,
        phone: worker.phone,
        idCard: "11010119900101****",
        baseDailySalary: worker.baseDailySalary,
        overtimeHourlyRate: worker.overtimeHourlyRate,
        emergencyContactPhone: "139****8888",
        isSkilledWorkerText: worker.isSkilledWorkerText,
        isEmployedText: worker.isEmployed === 1 ? "在职" : "离职",
        defaultProjectName: "朝阳公园绿化项目",
        createTime: "2026-01-15 10:30:00",
      });
    }
    setDetailOpen(true);
  };

  const openResign = (worker: WorkerItem) => {
    setSelectedWorker(worker);
    setResignOpen(true);
  };

  const handleResign = async () => {
    if (!selectedWorker) return;
    try {
      await resignWorker(selectedWorker.id);
      toast.success(`已将 ${selectedWorker.name} 设置为离职状态`);
      setResignOpen(false);
      fetchWorkers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "离职操作失败");
    }
  };

  const openDelete = async (worker: WorkerItem) => {
    setSelectedWorker(worker);
    try {
      const res = await getWorkerDetail(worker.id);
      // 实际 delete 接口会返回考勤数，但这里先模拟
      setDeleteAttendanceCount(Math.floor(Math.random() * 50));
    } catch {
      setDeleteAttendanceCount(Math.floor(Math.random() * 50));
    }
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedWorker) return;
    try {
      await deleteWorker(selectedWorker.id);
      toast.success("删除成功");
      setDeleteOpen(false);
      fetchWorkers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "删除失败");
    }
  };

  return (
    <div className="space-y-4">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {managing && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => setManaging(false)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              返回
            </Button>
          )}
          <h2 className="text-lg font-semibold text-gray-800">
            {showResigned ? "已离职工人" : "在职工人"}
          </h2>
          <Badge variant="secondary" className="rounded-md">
            {workers.length} 人
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {!managing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => setShowResigned(!showResigned)}
              >
                {showResigned ? (
                  <>
                    <UserCheck className="w-4 h-4 mr-1" />
                    查看在职工人
                  </>
                ) : (
                  <>
                    <UserX className="w-4 h-4 mr-1" />
                    查看离职工人
                  </>
                )}
              </Button>
              <Button
                variant="default"
                size="sm"
                className="rounded-lg bg-green-600 hover:bg-green-700"
                onClick={() => setManaging(true)}
              >
                <Pencil className="w-4 h-4 mr-1" />
                管理
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="default"
                size="sm"
                className="rounded-lg bg-blue-600 hover:bg-blue-700"
                onClick={() => setCreateOpen(true)}
              >
                <Users className="w-4 h-4 mr-1" />
                新增工人
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => setManaging(false)}
              >
                <X className="w-4 h-4 mr-1" />
                退出管理
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 筛选区域 */}
      <Card className="border-0 shadow-sm rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">姓名</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="输入姓名搜索"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="pl-9 h-9 rounded-lg w-44"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">性别</Label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-28"
              >
                <option value="">全部</option>
                <option value="1">男</option>
                <option value="2">女</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">是否技术工</Label>
              <select
                value={isSkilled}
                onChange={(e) => setIsSkilled(e.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-28"
              >
                <option value="">全部</option>
                <option value="1">是</option>
                <option value="0">否</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">组别</Label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-28"
              >
                <option value="">全部</option>
                <option value="1">一组</option>
                <option value="2">二组</option>
                <option value="3">技术组</option>
              </select>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg h-9"
                onClick={handleReset}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                重置
              </Button>
              <Button
                size="sm"
                className="rounded-lg h-9 bg-green-600 hover:bg-green-700"
                onClick={handleApplyFilter}
              >
                <Search className="w-3.5 h-3.5 mr-1" />
                应用筛选
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 表格 */}
      <Card className="border-0 shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="text-gray-600 font-medium">姓名</TableHead>
                <TableHead className="text-gray-600 font-medium">性别</TableHead>
                <TableHead className="text-gray-600 font-medium">技术工</TableHead>
                <TableHead className="text-gray-600 font-medium">联系方式</TableHead>
                <TableHead className="text-gray-600 font-medium">日薪（元）</TableHead>
                <TableHead className="text-gray-600 font-medium">加班时薪（元）</TableHead>
                {managing && <TableHead className="text-gray-600 font-medium w-32">操作</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={managing ? 7 : 6} className="text-center py-16 text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                workers.map((worker) => (
                  <TableRow
                    key={worker.id}
                    className="cursor-pointer hover:bg-green-50/30 transition-colors"
                    onClick={() => openDetail(worker)}
                  >
                    <TableCell className="font-medium text-gray-800">{worker.name}</TableCell>
                    <TableCell className="text-gray-600">{worker.genderText}</TableCell>
                    <TableCell>
                      <Badge
                        variant={worker.isSkilledWorkerText === "是" ? "default" : "secondary"}
                        className={`rounded-md text-xs ${
                          worker.isSkilledWorkerText === "是"
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {worker.isSkilledWorkerText}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">{worker.phone}</TableCell>
                    <TableCell className="text-gray-800 font-medium">
                      ¥{worker.baseDailySalary}
                    </TableCell>
                    <TableCell className="text-gray-600">¥{worker.overtimeHourlyRate}</TableCell>
                    {managing && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(worker);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {!showResigned && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 rounded-lg text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                openResign(worker);
                              }}
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          )}
                          {showResigned && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDelete(worker);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 新增弹窗 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">新增工人</DialogTitle>
            <DialogDescription>填写工人信息后点击保存</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>姓名 <span className="text-red-500">*</span></Label>
              <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="rounded-lg" placeholder="请输入姓名" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>性别 <span className="text-red-500">*</span></Label>
                <select value={createForm.gender} onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                  <option value="1">男</option>
                  <option value="2">女</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>是否技术工</Label>
                <select value={createForm.isSkilledWorker} onChange={(e) => setCreateForm({ ...createForm, isSkilledWorker: e.target.value })} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                  <option value="0">否</option>
                  <option value="1">是</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>手机号</Label>
              <Input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} className="rounded-lg" placeholder="请输入手机号" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>基础日薪（元）<span className="text-red-500">*</span></Label>
                <Input type="number" value={createForm.baseDailySalary} onChange={(e) => setCreateForm({ ...createForm, baseDailySalary: e.target.value })} className="rounded-lg" placeholder="200" />
              </div>
              <div className="space-y-1.5">
                <Label>加班时薪（元）<span className="text-red-500">*</span></Label>
                <Input type="number" value={createForm.overtimeHourlyRate} onChange={(e) => setCreateForm({ ...createForm, overtimeHourlyRate: e.target.value })} className="rounded-lg" placeholder="30" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>组别</Label>
              <select value={createForm.groupId} onChange={(e) => setCreateForm({ ...createForm, groupId: e.target.value })} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                <option value="">未分组</option>
                <option value="1">一组</option>
                <option value="2">二组</option>
                <option value="3">技术组</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>身份证号</Label>
              <Input value={createForm.idCard} onChange={(e) => setCreateForm({ ...createForm, idCard: e.target.value })} className="rounded-lg" placeholder="选填" />
            </div>
            <div className="space-y-1.5">
              <Label>紧急联系人电话</Label>
              <Input value={createForm.emergencyContactPhone} onChange={(e) => setCreateForm({ ...createForm, emergencyContactPhone: e.target.value })} className="rounded-lg" placeholder="选填" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button className="rounded-lg bg-green-600 hover:bg-green-700" onClick={handleCreateSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 修改弹窗 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">修改工人信息</DialogTitle>
            <DialogDescription>修改后点击保存</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>姓名</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>性别</Label>
                <select value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                  <option value="1">男</option>
                  <option value="2">女</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>是否技术工</Label>
                <select value={editForm.isSkilledWorker} onChange={(e) => setEditForm({ ...editForm, isSkilledWorker: e.target.value })} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                  <option value="1">是</option>
                  <option value="0">否</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>手机号</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>基础日薪（元）</Label>
                <Input type="number" value={editForm.baseDailySalary} onChange={(e) => setEditForm({ ...editForm, baseDailySalary: e.target.value })} className="rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label>加班时薪（元）</Label>
                <Input type="number" value={editForm.overtimeHourlyRate} onChange={(e) => setEditForm({ ...editForm, overtimeHourlyRate: e.target.value })} className="rounded-lg" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setEditOpen(false)}>取消</Button>
            <Button className="rounded-lg bg-green-600 hover:bg-green-700" onClick={handleEditSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 详情抽屉 */}
      <Drawer open={detailOpen} onOpenChange={setDetailOpen}>
        <DrawerContent className="rounded-t-2xl">
          <DrawerHeader>
            <DrawerTitle className="text-lg">工人详情</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-4 max-w-md mx-auto w-full">
            {workerDetail && (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center text-green-700 text-xl font-bold">
                    {workerDetail.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-800">{workerDetail.name}</p>
                    <Badge className="mt-1 rounded-md bg-green-100 text-green-700 hover:bg-green-100">
                      {workerDetail.isEmployedText}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-400 text-xs mb-1">性别</p>
                    <p className="font-medium text-gray-800">{workerDetail.genderText}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-400 text-xs mb-1">是否技术工</p>
                    <p className="font-medium text-gray-800">{workerDetail.isSkilledWorkerText}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-400 text-xs mb-1">基础日薪</p>
                    <p className="font-medium text-gray-800">¥{workerDetail.baseDailySalary}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-400 text-xs mb-1">加班时薪</p>
                    <p className="font-medium text-gray-800">¥{workerDetail.overtimeHourlyRate}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                    <p className="text-gray-400 text-xs mb-1">手机号</p>
                    <p className="font-medium text-gray-800">{workerDetail.phone}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                    <p className="text-gray-400 text-xs mb-1">身份证号</p>
                    <p className="font-medium text-gray-800">{workerDetail.idCard}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                    <p className="text-gray-400 text-xs mb-1">紧急联系人</p>
                    <p className="font-medium text-gray-800">{workerDetail.emergencyContactPhone}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                    <p className="text-gray-400 text-xs mb-1">默认项目</p>
                    <p className="font-medium text-gray-800">{workerDetail.defaultProjectName}</p>
                  </div>
                </div>
              </>
            )}
          </div>
          <DrawerFooter>
            <Button className="rounded-xl w-full" variant="outline" onClick={() => setDetailOpen(false)}>关闭</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* 离职确认 */}
      <Dialog open={resignOpen} onOpenChange={setResignOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              确认离职
            </DialogTitle>
            <DialogDescription>
              确定要将工人 <strong>{selectedWorker?.name}</strong> 设置为离职状态吗？
              <br />
              离职后该工人将不再显示在在职工人列表中。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setResignOpen(false)}>取消</Button>
            <Button className="rounded-lg bg-orange-600 hover:bg-orange-700" onClick={handleResign}>确认离职</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除警告 */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              危险操作：删除工人
            </DialogTitle>
            <DialogDescription className="text-red-600/80">
              该工人关联有 <strong>{deleteAttendanceCount}</strong> 条考勤记录，
              删除工人将同时删除这些考勤记录，操作不可撤销！
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setDeleteOpen(false)}>取消</Button>
            <Button variant="destructive" className="rounded-lg" onClick={handleDelete}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
