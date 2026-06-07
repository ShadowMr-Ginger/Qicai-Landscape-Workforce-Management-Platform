"use client";

import { usePathname } from "next/navigation";
import { Menu, Bell, Moon, Sun, Monitor } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const breadcrumbMap: Record<string, string> = {
  "/": "首页概览",
  "/workers": "工人管理",
  "/drivers": "司机管理",
  "/batches": "考勤审核",
  "/wages": "工资结算",
  "/projects": "项目管理",
  "/settings": "系统设置",
  "/system-logs": "系统日志",
  "/groups": "组别管理",
  "/worker-records": "工人考勤记录",
  "/driver-records": "司机考勤记录",
  "/work-types": "作业类型",
  "/worker-summary": "工人工资汇总",
  "/driver-summary": "司机工资汇总",
  "/workers/salary-defaults": "默认薪资",
  "/attendance-records": "考勤记录",
};

/**
 * 顶部导航栏组件
 *
 * <p>显示当前页面标题、面包屑和快捷操作。</p>
 */
export function Header() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, user } = useAuthStore();
  const { mode, setMode, resolvedMode } = useThemeStore();

  const pageTitle = breadcrumbMap[pathname] || "绿化管理系统";

  return (
    <header className="h-16 bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{pageTitle}</h2>
          <p className="text-xs text-muted-foreground hidden sm:block">
            绿化工人管理系统 · {new Date().toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* 主题切换 */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="relative w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors cursor-pointer">
              {resolvedMode === "dark" ? (
                <Moon className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Sun className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setMode("light")} className={cn(mode === "light" && "bg-accent")}>
              <Sun className="w-4 h-4 mr-2" /> 浅色模式
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMode("dark")} className={cn(mode === "dark" && "bg-accent")}>
              <Moon className="w-4 h-4 mr-2" /> 深色模式
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMode("system")} className={cn(mode === "system" && "bg-accent")}>
              <Monitor className="w-4 h-4 mr-2" /> 跟随系统
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button className="relative w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-bold dark:bg-green-900 dark:text-green-300">
              {user?.name?.charAt(0) || "A"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-foreground">{user?.name || "管理员"}</p>
            <p className="text-[10px] text-muted-foreground">{user?.roleName || "超级管理员"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
