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
  UserCheck,
  AlertTriangle,
  X,
  Car,
  KeyRound,
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
import { createDriver, getDriverList, getDriverDetail, updateDriver, resignDriver, deleteDriver, resetDriverPassword, getDriverAttendanceCount } from "@/lib/api";

interface DriverItem {
  id: number;
  realName: string;
  genderText: string;
  phone: string;
  baseDailySalary: number;
  overtimeHourlyRate: number;
  isActive: number;
}

interface DriverDetail {
  id: number;
  realName: string;
  genderText: string;
  phone: string;
  idCard: string;
  emergencyContactPhone: string;
  baseDailySalary: number;
  overtimeHourlyRate: number;
  wxOpenid: string;
  isActiveText: string;
  passwordChanged: number;
  createTime: string;
}

const mockDrivers: DriverItem[] = [
  { id: 1, realName: "张司机", genderText: "男", phone: "13900139001", baseDailySalary: 300, overtimeHourlyRate: 50, isActive: 1 },
  { id: 2, realName: "李司机", genderText: "男", phone: "13900139002", baseDailySalary: 280, overtimeHourlyRate: 45, isActive: 1 },
  { id: 3, realName: "王司机", genderText: "女", phone: "13900139003", baseDailySalary: 300, overtimeHourlyRate: 50, isActive: 1 },
  { id: 4, realName: "赵司机", genderText: "男", phone: "13900139004", baseDailySalary: 260, overtimeHourlyRate: 40, isActive: 0 },
];

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [gender, setGender] = useState("");
  const [showResigned, setShowResigned] = useState(false);
  const [managing, setManaging] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [resignOpen, setResignOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetPwdOpen, setResetPwdOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverItem | null>(null);
  const [driverDetail, setDriverDetail] = useState<DriverDetail | null>(null);
  const [deleteAttendanceCount, setDeleteAttendanceCount] = useState(0);

  const [createForm, setCreateForm] = useState({
    realName: "",
    gender: "1",
    phone: "",
    idCard: "",
    emergencyContactPhone: "",
    baseDailySalary: "",
    overtimeHourlyRate: "",
  });

  const [editForm, setEditForm] = useState({
    realName: "",
    gender: "1",
    phone: "",
    idCard: "",
    emergencyContactPhone: "",
    baseDailySalary: "",
    overtimeHourlyRate: "",
  });

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await getDriverList({
        keyword,
        gender: gender || undefined,
        isActive: showResigned ? 0 : 1,
        pageNum: 1,
        pageSize: 100,
      });
      if (res.code === 200 && res.data?.records) {
        // 后端连上了，始终信任后端数据（即使为空数组）
        setDrivers(res.data.records);
      } else {
        setDrivers(
          mockDrivers.filter((d) => {
            if (showResigned ? d.isActive === 1 : d.isActive === 0) return false;
            if (keyword && !d.realName.includes(keyword)) return false;
            if (gender && d.genderText !== (gender === "1" ? "男" : "女")) return false;
            return true;
          })
        );
      }
    } catch {
      setDrivers(
        mockDrivers.filter((d) => {
          if (showResigned ? d.isActive === 1 : d.isActive === 0) return false;
          if (keyword && !d.realName.includes(keyword)) return false;
          if (gender && d.genderText !== (gender === "1" ? "男" : "女")) return false;
          return true;
        })
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [showResigned]);

  const handleApplyFilter = () => {
    fetchDrivers();
  };

  const handleReset = () => {
    setKeyword("");
    setGender("");
    fetchDrivers();
  };

  const openEdit = async (driver: DriverItem) => {
    setSelectedDriver(driver);
    try {
      const res = await getDriverDetail(driver.id);
      if (res.code === 200 && res.data) {
        const d = res.data;
        setEditForm({
          realName: d.realName,
          gender: d.genderText === "男" ? "1" : "2",
          phone: d.phone || "",
          idCard: d.idCard || "",
          emergencyContactPhone: d.emergencyContactPhone || "",
          baseDailySalary: String(d.baseDailySalary),
          overtimeHourlyRate: String(d.overtimeHourlyRate),
        });
      }
    } catch {
      setEditForm({
        realName: driver.realName,
        gender: driver.genderText === "男" ? "1" : "2",
        phone: driver.phone,
        idCard: "",
        emergencyContactPhone: "",
        baseDailySalary: String(driver.baseDailySalary),
        overtimeHourlyRate: String(driver.overtimeHourlyRate),
      });
    }
    setEditOpen(true);
  };

  const handleCreateSave = async () => {
    if (!createForm.realName.trim()) {
      toast.error("姓名不能为空");
      return;
    }
    try {
      await createDriver({
        realName: createForm.realName,
        gender: Number(createForm.gender),
        phone: createForm.phone,
        idCard: createForm.idCard || undefined,
        emergencyContactPhone: createForm.emergencyContactPhone || undefined,
        baseDailySalary: Number(createForm.baseDailySalary),
        overtimeHourlyRate: Number(createForm.overtimeHourlyRate),
      });
      toast.success("新增司机成功，默认密码为 123456");
      setCreateOpen(false);
      setCreateForm({ realName: "", gender: "1", phone: "", idCard: "", emergencyContactPhone: "", baseDailySalary: "", overtimeHourlyRate: "" });
      await fetchDrivers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "新增司机失败，请检查网络或联系管理员");
    }
  };

  const handleEditSave = async () => {
    if (!selectedDriver) return;
    try {
      await updateDriver(selectedDriver.id, {
        realName: editForm.realName,
        gender: Number(editForm.gender),
        phone: editForm.phone,
        idCard: editForm.idCard || undefined,
        emergencyContactPhone: editForm.emergencyContactPhone || undefined,
        baseDailySalary: Number(editForm.baseDailySalary),
        overtimeHourlyRate: Number(editForm.overtimeHourlyRate),
      });
      toast.success("修改成功");
      setEditOpen(false);
      await fetchDrivers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "修改失败");
    }
  };

  const openDetail = async (driver: DriverItem) => {
    setSelectedDriver(driver);
    try {
      const res = await getDriverDetail(driver.id);
      if (res.code === 200 && res.data) {
        setDriverDetail(res.data);
      }
    } catch {
      setDriverDetail({
        id: driver.id,
        realName: driver.realName,
        genderText: driver.genderText,
        phone: driver.phone,
        baseDailySalary: driver.baseDailySalary,
        overtimeHourlyRate: driver.overtimeHourlyRate,
        idCard: "",
        emergencyContactPhone: "",
        wxOpenid: "wx_xxxxxxxxx",
        isActiveText: driver.isActive === 1 ? "在职" : "离职",
        passwordChanged: 1,
        createTime: "2026-01-10 09:00:00",
      });
    }
    setDetailOpen(true);
  };

  const openResign = (driver: DriverItem) => {
    setSelectedDriver(driver);
    setResignOpen(true);
  };

  const openResetPwd = (driver: DriverItem) => {
    setSelectedDriver(driver);
    setResetPwdOpen(true);
  };

  const handleResetPwd = async () => {
    if (!selectedDriver) return;
    try {
      await resetDriverPassword(selectedDriver.id);
      toast.success(`已将 ${selectedDriver.realName} 的密码重置为 123456`);
      setResetPwdOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "重置密码失败");
    }
  };

  const handleResign = async () => {
    if (!selectedDriver) return;
    try {
      await resignDriver(selectedDriver.id);
      toast.success(`已将 ${selectedDriver.realName} 设置为离职状态`);
      setResignOpen(false);
      await fetchDrivers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "离职操作失败");
    }
  };

  const openDelete = async (driver: DriverItem) => {
    setSelectedDriver(driver);
    try {
      const res = await getDriverAttendanceCount(driver.id);
      setDeleteAttendanceCount(res.data || 0);
    } catch {
      setDeleteAttendanceCount(0);
    }
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedDriver) return;
    try {
      await deleteDriver(selectedDriver.id);
      toast.success("删除成功");
      setDeleteOpen(false);
      await fetchDrivers();
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
            <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setManaging(false)}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              返回
            </Button>
          )}
          <h2 className="text-lg font-semibold text-foreground">
            {showResigned ? "已离职司机" : "在职司机"}
          </h2>
          <Badge variant="secondary" className="rounded-md">{drivers.length} 人</Badge>
        </div>
        <div className="flex items-center gap-2">
          {!managing ? (
            <>
              <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setShowResigned(!showResigned)}>
                {showResigned ? (
                  <><UserCheck className="w-4 h-4 mr-1" />查看在职司机</>
                ) : (
                  <><UserX className="w-4 h-4 mr-1" />查看离职司机</>
                )}
              </Button>
              <Button variant="default" size="sm" className="rounded-lg bg-green-600 hover:bg-green-700" onClick={() => setManaging(true)}>
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
                <Car className="w-4 h-4 mr-1" />
                新增司机
              </Button>
              <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setManaging(false)}>
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
              <Label className="text-xs text-muted-foreground">姓名</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
                <Input placeholder="输入姓名搜索" value={keyword} onChange={(e) => setKeyword(e.target.value)} className="pl-9 h-9 rounded-lg w-44" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">性别</Label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-28">
                <option value="">全部</option>
                <option value="1">男</option>
                <option value="2">女</option>
              </select>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm" className="rounded-lg h-9" onClick={handleReset}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                重置
              </Button>
              <Button size="sm" className="rounded-lg h-9 bg-green-600 hover:bg-green-700" onClick={handleApplyFilter}>
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
              <TableRow className="bg-background/50 hover:bg-background/50">
                <TableHead className="text-muted-foreground font-medium">姓名</TableHead>
                <TableHead className="text-muted-foreground font-medium">性别</TableHead>
                <TableHead className="text-muted-foreground font-medium">联系方式</TableHead>
                <TableHead className="text-muted-foreground font-medium">日薪（元）</TableHead>
                <TableHead className="text-muted-foreground font-medium">加班时薪（元）</TableHead>
                {managing && <TableHead className="text-muted-foreground font-medium w-32">操作</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={managing ? 6 : 5} className="text-center py-16 text-muted-foreground/70">
                    <Car className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                drivers.map((driver) => (
                  <TableRow key={driver.id} className="cursor-pointer hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors" onClick={() => openDetail(driver)}>
                    <TableCell className="font-medium text-foreground">{driver.realName}</TableCell>
                    <TableCell className="text-muted-foreground">{driver.genderText}</TableCell>
                    <TableCell className="text-muted-foreground">{driver.phone}</TableCell>
                    <TableCell className="text-foreground font-medium">¥{driver.baseDailySalary}</TableCell>
                    <TableCell className="text-muted-foreground">¥{driver.overtimeHourlyRate}</TableCell>
                    {managing && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 dark:bg-blue-950/30"
                            onClick={(e) => { e.stopPropagation(); openEdit(driver); }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {!showResigned && (
                            <>
                              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/30 dark:bg-orange-950/30"
                                onClick={(e) => { e.stopPropagation(); openResign(driver); }}>
                                <UserX className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                onClick={(e) => { e.stopPropagation(); openResetPwd(driver); }}>
                                <KeyRound className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {showResigned && (
                            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 dark:bg-red-950/30"
                              onClick={(e) => { e.stopPropagation(); openDelete(driver); }}>
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
            <DialogTitle className="text-lg">新增司机</DialogTitle>
            <DialogDescription>填写司机信息后点击保存，默认密码为 123456</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>姓名 <span className="text-red-500">*</span></Label>
              <Input value={createForm.realName} onChange={(e) => setCreateForm({ ...createForm, realName: e.target.value })} className="rounded-lg" placeholder="请输入姓名" />
            </div>
            <div className="space-y-1.5">
              <Label>性别 <span className="text-red-500">*</span></Label>
              <select value={createForm.gender} onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                <option value="1">男</option>
                <option value="2">女</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>手机号</Label>
              <Input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} className="rounded-lg" placeholder="请输入手机号" />
            </div>
            <div className="space-y-1.5">
              <Label>身份证号</Label>
              <Input value={createForm.idCard} onChange={(e) => setCreateForm({ ...createForm, idCard: e.target.value })} className="rounded-lg" placeholder="选填" />
            </div>
            <div className="space-y-1.5">
              <Label>紧急联系人电话</Label>
              <Input value={createForm.emergencyContactPhone} onChange={(e) => setCreateForm({ ...createForm, emergencyContactPhone: e.target.value })} className="rounded-lg" placeholder="选填" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>基础日薪（元）<span className="text-red-500">*</span></Label>
                <Input type="number" value={createForm.baseDailySalary} onChange={(e) => setCreateForm({ ...createForm, baseDailySalary: e.target.value })} className="rounded-lg" placeholder="300" />
              </div>
              <div className="space-y-1.5">
                <Label>加班时薪（元）<span className="text-red-500">*</span></Label>
                <Input type="number" value={createForm.overtimeHourlyRate} onChange={(e) => setCreateForm({ ...createForm, overtimeHourlyRate: e.target.value })} className="rounded-lg" placeholder="50" />
              </div>
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
            <DialogTitle className="text-lg">修改司机信息</DialogTitle>
            <DialogDescription>修改后点击保存</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>姓名</Label>
              <Input value={editForm.realName} onChange={(e) => setEditForm({ ...editForm, realName: e.target.value })} className="rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label>性别</Label>
              <select value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                <option value="1">男</option>
                <option value="2">女</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>手机号</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label>身份证号</Label>
              <Input value={editForm.idCard} onChange={(e) => setEditForm({ ...editForm, idCard: e.target.value })} className="rounded-lg" placeholder="选填" />
            </div>
            <div className="space-y-1.5">
              <Label>紧急联系人电话</Label>
              <Input value={editForm.emergencyContactPhone} onChange={(e) => setEditForm({ ...editForm, emergencyContactPhone: e.target.value })} className="rounded-lg" placeholder="选填" />
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
            <DrawerTitle className="text-lg">司机详情</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-4 max-w-md mx-auto w-full">
            {driverDetail && (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-700 dark:text-green-300 text-xl font-bold">
                    {driverDetail.realName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{driverDetail.realName}</p>
                    <Badge className="mt-1 rounded-md bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-100 dark:bg-green-900/40">
                      {driverDetail.isActiveText}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted/30 rounded-xl p-3">
                    <p className="text-muted-foreground/70 text-xs mb-1">性别</p>
                    <p className="font-medium text-foreground">{driverDetail.genderText}</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3">
                    <p className="text-muted-foreground/70 text-xs mb-1">密码状态</p>
                    <p className="font-medium text-foreground">{driverDetail.passwordChanged === 1 ? "已修改" : "未修改"}</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3">
                    <p className="text-muted-foreground/70 text-xs mb-1">基础日薪</p>
                    <p className="font-medium text-foreground">¥{driverDetail.baseDailySalary}</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3">
                    <p className="text-muted-foreground/70 text-xs mb-1">加班时薪</p>
                    <p className="font-medium text-foreground">¥{driverDetail.overtimeHourlyRate}</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3 col-span-2">
                    <p className="text-muted-foreground/70 text-xs mb-1">手机号</p>
                    <p className="font-medium text-foreground">{driverDetail.phone}</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3 col-span-2">
                    <p className="text-muted-foreground/70 text-xs mb-1">身份证号</p>
                    <p className="font-medium text-foreground">{driverDetail.idCard || "-"}</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3 col-span-2">
                    <p className="text-muted-foreground/70 text-xs mb-1">紧急联系人电话</p>
                    <p className="font-medium text-foreground">{driverDetail.emergencyContactPhone || "-"}</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3 col-span-2">
                    <p className="text-muted-foreground/70 text-xs mb-1">微信 OpenID</p>
                    <p className="font-medium text-foreground font-mono text-xs">{driverDetail.wxOpenid}</p>
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
            <DialogTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <AlertTriangle className="w-5 h-5" />
              确认离职
            </DialogTitle>
            <DialogDescription>
              确定要将司机 <strong>{selectedDriver?.realName}</strong> 设置为离职状态吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setResignOpen(false)}>取消</Button>
            <Button className="rounded-lg bg-orange-600 hover:bg-orange-700" onClick={handleResign}>确认离职</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重置密码确认 */}
      <Dialog open={resetPwdOpen} onOpenChange={setResetPwdOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-600">
              <KeyRound className="w-5 h-5" />
              重置密码
            </DialogTitle>
            <DialogDescription>
              确定要重置司机 <strong>{selectedDriver?.realName}</strong> 的密码吗？
              <br />
              重置后密码将变为 <strong>123456</strong>，司机下次登录时必须重新修改密码。
              <br />
              <span className="text-red-500">此操作不可撤销！</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setResetPwdOpen(false)}>取消</Button>
            <Button className="rounded-lg bg-purple-600 hover:bg-purple-700" onClick={handleResetPwd}>确认重置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除警告 */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              危险操作：删除司机
            </DialogTitle>
            <DialogDescription className="text-red-600 dark:text-red-400/80">
              该司机关联有 <strong>{deleteAttendanceCount}</strong> 条考勤记录，
              删除将同时删除这些记录，操作不可撤销！
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
