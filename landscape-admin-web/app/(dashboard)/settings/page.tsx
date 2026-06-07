"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Sun,
  Moon,
  Monitor,
  User,
  Lock,
  Info,
  LogOut,
  Palette,
  ShieldCheck,
  Smartphone,
  Server,
  Database,
  Code2,
  Check,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { getCurrentUser } from "@/lib/api";

const themeOptions = [
  { value: "light" as const, label: "浅色模式", icon: Sun },
  { value: "dark" as const, label: "深色模式", icon: Moon },
  { value: "system" as const, label: "跟随系统", icon: Monitor },
];

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const { mode, setMode, resolvedMode } = useThemeStore();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((res) => {
        if (res.code === 200 && res.data) {
          setCurrentUser(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      toast.error("请填写完整密码信息");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("两次输入的新密码不一致");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("新密码长度不能少于6位");
      return;
    }
    setChangingPassword(true);
    // TODO: 接入后端修改密码接口
    setTimeout(() => {
      toast.info("密码修改功能尚未接入后端，请联系系统管理员");
      setChangingPassword(false);
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    }, 600);
  };

  const displayUser = currentUser || user;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">系统设置</h1>
        <p className="text-sm text-muted-foreground mt-1">
          管理您的个性化偏好、账号安全与系统信息
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 外观设置 */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-green-600 dark:text-green-400 dark:text-green-400" />
              <CardTitle className="text-base">外观设置</CardTitle>
            </div>
            <CardDescription>自定义管理后台的显示主题</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const active = mode === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setMode(opt.value)}
                    className={cn(
                      "relative flex flex-col items-center gap-2 rounded-xl border p-3 transition-all duration-200",
                      active
                        ? "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 dark:bg-green-950/40 dark:text-green-400 dark:border-green-600"
                        : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {active && (
                      <span className="absolute top-1.5 right-1.5">
                        <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400 dark:text-green-400" />
                      </span>
                    )}
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              当前生效：
              <span className="font-medium text-foreground ml-1">
                {resolvedMode === "dark" ? "深色模式" : "浅色模式"}
              </span>
              {mode === "system" && "（跟随系统）"}
            </div>
          </CardContent>
        </Card>

        {/* 账号信息 */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-green-600 dark:text-green-400 dark:text-green-400" />
              <CardTitle className="text-base">账号信息</CardTitle>
            </div>
            <CardDescription>当前登录管理员的基本信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14 border-2 border-border">
                <AvatarFallback className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-lg font-bold dark:bg-green-900 dark:text-green-300">
                  {displayUser?.name?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base font-semibold text-foreground">
                  {displayUser?.name || "管理员"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-500 dark:text-green-400" />
                  <span className="text-xs text-muted-foreground">
                    {displayUser?.roleName || "超级管理员"}
                  </span>
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">用户ID</span>
                <span className="text-sm font-mono text-foreground bg-muted px-2 py-0.5 rounded">
                  {displayUser?.userId || "-"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">用户类型</span>
                <span className="text-sm font-medium text-foreground">
                  {displayUser?.userType === "ADMIN" ? "管理员" : displayUser?.userType || "-"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 安全设置 */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-green-600 dark:text-green-400 dark:text-green-400" />
              <CardTitle className="text-base">安全设置</CardTitle>
            </div>
            <CardDescription>修改登录密码以保障账号安全</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="old-password" className="text-sm">
                  当前密码
                </Label>
                <Input
                  id="old-password"
                  type="password"
                  placeholder="请输入当前密码"
                  value={passwordForm.oldPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({ ...p, oldPassword: e.target.value }))
                  }
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm">
                  新密码
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="至少6位字符"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))
                  }
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm">
                  确认新密码
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="再次输入新密码"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))
                  }
                  className="rounded-lg"
                />
              </div>
              <div className="sm:col-span-3 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  建议定期更换密码，并使用包含字母与数字的组合
                </p>
                <Button
                  type="submit"
                  disabled={changingPassword}
                  className="rounded-lg bg-green-600 hover:bg-green-700 text-white"
                >
                  {changingPassword ? "保存中..." : "修改密码"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 系统信息 */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-green-600 dark:text-green-400 dark:text-green-400" />
              <CardTitle className="text-base">系统信息</CardTitle>
            </div>
            <CardDescription>当前系统的版本与技术栈</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <Server className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">后端版本</p>
                <p className="text-sm font-medium text-foreground">Spring Boot 3.2.5</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <Code2 className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">前端版本</p>
                <p className="text-sm font-medium text-foreground">Next.js 16.2.7</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <Database className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">数据库</p>
                <p className="text-sm font-medium text-foreground">MySQL 8.0</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <Smartphone className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">小程序</p>
                <p className="text-sm font-medium text-foreground">微信原生 + TypeScript</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 快捷操作 */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <LogOut className="w-5 h-5 text-green-600 dark:text-green-400 dark:text-green-400" />
              <CardTitle className="text-base">快捷操作</CardTitle>
            </div>
            <CardDescription>账号会话管理</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">退出登录</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    安全退出当前管理后台会话
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="rounded-lg border-red-300 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 dark:bg-red-950/30 hover:text-red-700 dark:hover:text-red-300 dark:text-red-300 dark:hover:bg-red-950/30"
                  onClick={() => {
                    logout();
                    window.location.href = "/login";
                  }}
                >
                  <LogOut className="w-4 h-4 mr-1.5" />
                  退出登录
                </Button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed">
              提示：出于安全考虑，长时间未操作后系统会自动要求重新登录。
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
