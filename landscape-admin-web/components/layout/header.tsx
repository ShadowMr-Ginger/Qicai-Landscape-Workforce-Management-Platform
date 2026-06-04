"use client";

import { usePathname } from "next/navigation";
import { Menu, Bell } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const breadcrumbMap: Record<string, string> = {
  "/": "首页概览",
  "/workers": "工人管理",
  "/drivers": "司机管理",
  "/batches": "考勤审核",
  "/wages": "工资结算",
  "/projects": "项目管理",
  "/settings": "系统设置",
};

/**
 * 顶部导航栏组件
 *
 * <p>显示当前页面标题、面包屑和快捷操作。</p>
 */
export function Header() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, user } = useAuthStore();

  const pageTitle = breadcrumbMap[pathname] || "绿化管理系统";

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30 flex items-center justify-between px-6">
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
          <h2 className="text-lg font-semibold text-gray-800">{pageTitle}</h2>
          <p className="text-xs text-gray-400 hidden sm:block">
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
        <button className="relative w-9 h-9 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors">
          <Bell className="w-4 h-4 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-gray-100">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-green-100 text-green-700 text-xs font-bold">
              {user?.name?.charAt(0) || "A"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-700">{user?.name || "管理员"}</p>
            <p className="text-[10px] text-gray-400">{user?.roleName || "超级管理员"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
