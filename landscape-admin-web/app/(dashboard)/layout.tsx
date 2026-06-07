"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

/**
 * 后台布局
 *
 * <p>包含左侧侧边栏、顶部导航栏和主内容区域。</p>
 * <p>未登录用户自动重定向到登录页。</p>
 * <p>修复 SSR hydration 问题：等待客户端挂载后再检查登录状态。</p>
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { token, sidebarCollapsed } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !token) {
      router.push("/login");
    }
  }, [mounted, token, router]);

  // 客户端挂载前显示占位，避免 SSR 阶段 token 为 null 导致闪烁/跳转
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background/50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background/50">
      <Toaster position="top-right" richColors />
      <Sidebar />
      <div
        className={cn(
          "transition-all duration-300 min-h-screen flex flex-col",
          sidebarCollapsed ? "ml-20" : "ml-64"
        )}
      >
        <Header />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
