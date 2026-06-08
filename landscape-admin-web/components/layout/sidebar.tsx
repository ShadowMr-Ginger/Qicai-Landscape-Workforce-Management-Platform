"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  ClipboardCheck,
  Wallet,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Leaf,
  ShieldCheck,
  List,
  FolderTree,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  title: string;
  href?: string;
  icon?: React.ElementType;
  badge?: number;
  children?: { title: string; href: string }[];
}

const navItems: NavItem[] = [
  { title: "首页概览", href: "/", icon: LayoutDashboard },
  {
    title: "工人管理",
    icon: Users,
    children: [
      { title: "工人列表", href: "/workers" },
      { title: "组别管理", href: "/groups" },
      { title: "默认薪资", href: "/workers/salary-defaults" },
    ],
  },
  { title: "司机管理", href: "/drivers", icon: UserCircle },
  {
    title: "考勤管理",
    icon: ClipboardCheck,
    children: [
      { title: "考勤审核", href: "/batches" },
      { title: "考勤记录", href: "/attendance-records" },
      { title: "作业类型", href: "/work-types" },
    ],
  },
  { title: "工资结算", href: "/wages", icon: Wallet },
  { title: "项目管理", href: "/projects", icon: Building2 },
  { title: "异常记录", href: "/anomalies", icon: AlertTriangle },
  { title: "系统日志", href: "/system-logs", icon: FileText },
  { title: "系统设置", href: "/settings", icon: Settings },
];

/**
 * 侧边栏组件
 */
export function Sidebar() {
  const pathname = usePathname();
  const { user, sidebarCollapsed, toggleSidebar, logout } = useAuthStore();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    "工人管理": pathname === "/workers" || pathname === "/groups",
  });

  const toggleMenu = (title: string) => {
    setExpandedMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        sidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo 区域 */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-sm shrink-0">
          <Leaf className="w-5 h-5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="ml-3 overflow-hidden">
            <h1 className="text-base font-bold text-sidebar-foreground whitespace-nowrap">
              绿化管理系统
            </h1>
            <p className="text-[10px] text-sidebar-foreground/60 whitespace-nowrap">管理后台</p>
          </div>
        )}
      </div>

      {/* 折叠按钮 */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center shadow-sm hover:bg-muted transition-colors"
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-muted-foreground" />
        )}
      </button>

      {/* 导航菜单 */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          if (item.children && !sidebarCollapsed) {
            const isChildActive = item.children.some((c) => pathname === c.href);
            const isExpanded = expandedMenus[item.title] || isChildActive;
            return (
              <div key={item.title}>
                <button
                  onClick={() => toggleMenu(item.title)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    isChildActive
                      ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 shadow-sm dark:bg-green-950/40 dark:text-green-400"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  {item.icon && (
                    <item.icon
                      className={cn(
                        "w-5 h-5 shrink-0",
                        isChildActive ? "text-green-600 dark:text-green-400 dark:text-green-400" : "text-sidebar-foreground/50"
                      )}
                    />
                  )}
                  <span className="truncate flex-1 text-left">{item.title}</span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-sidebar-foreground/50 transition-transform duration-200",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>
                {isExpanded && (
                  <div className="mt-1 ml-4 pl-4 border-l border-sidebar-border space-y-1">
                    {item.children.map((child) => {
                      const childActive = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                            childActive
                              ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 font-medium dark:bg-green-950/40 dark:text-green-400"
                              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                          )}
                        >
                          {child.title === "工人列表" ? (
                            <List className="w-4 h-4" />
                          ) : (
                            <FolderTree className="w-4 h-4" />
                          )}
                          <span>{child.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // 折叠状态或没有子菜单：直接渲染为链接
          if (item.children && sidebarCollapsed) {
            const isChildActive = item.children.some((c) => pathname === c.href);
            return (
              <Link
                key={item.title}
                href={item.children[0].href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                  isChildActive
                    ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 shadow-sm dark:bg-green-950/40 dark:text-green-400"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
                title={item.title}
              >
                {item.icon && (
                  <item.icon
                    className={cn(
                      "w-5 h-5 shrink-0",
                      isChildActive ? "text-green-600 dark:text-green-400 dark:text-green-400" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
                    )}
                  />
                )}
              </Link>
            );
          }

          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 shadow-sm dark:bg-green-950/40 dark:text-green-400"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
              title={sidebarCollapsed ? item.title : undefined}
            >
              {item.icon && (
                <item.icon
                  className={cn(
                    "w-5 h-5 shrink-0",
                    isActive ? "text-green-600 dark:text-green-400 dark:text-green-400" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
                  )}
                />
              )}
              {!sidebarCollapsed && (
                <span className="truncate">{item.title}</span>
              )}
              {!sidebarCollapsed && item.badge && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                  {item.badge}
                </span>
              )}
              {sidebarCollapsed && item.badge && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <Separator className="mx-3 w-auto bg-sidebar-border/50" />

      {/* 底部用户信息 */}
      <div className="p-3">
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl p-2 transition-all",
            sidebarCollapsed ? "justify-center" : "bg-sidebar-accent/60"
          )}
        >
          <Avatar className="w-9 h-9 border-2 border-white shadow-sm">
            <AvatarFallback className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-sm font-bold dark:bg-green-900 dark:text-green-300">
              {user?.name?.charAt(0) || "A"}
            </AvatarFallback>
          </Avatar>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.name || "管理员"}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-green-500 dark:text-green-400" />
                <span className="text-[11px] text-sidebar-foreground/60">
                  {user?.roleName || "超级管理员"}
                </span>
              </div>
            </div>
          )}
        </div>
        {!sidebarCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-sidebar-foreground/60 hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 dark:bg-red-950/30 dark:hover:bg-red-950/30 text-xs"
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
          >
            退出登录
          </Button>
        )}
      </div>
    </aside>
  );
}
