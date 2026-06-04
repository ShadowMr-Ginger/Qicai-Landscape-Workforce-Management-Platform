"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Leaf, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminLogin } from "@/lib/api";

/**
 * 管理员登录页面
 *
 * <p>管理后台的入口页面，采用绿色主题设计，支持真实 API 登录和模拟登录 fallback。</p>
 */
export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDemo, setIsDemo] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 尝试真实 API 登录
      const res = await adminLogin(username, password);
      if (res.code === 200 && res.data) {
        const { token, userInfo } = res.data;
        localStorage.setItem("token", token);
        setAuth(token, {
          userId: userInfo.userId,
          userType: userInfo.userType as "ADMIN" | "DRIVER",
          name: userInfo.name,
          roleName: "超级管理员",
        });
        router.push("/");
        return;
      }
    } catch {
      // API 调用失败，自动 fallback 到模拟登录
    }

    // 模拟登录模式（确保即使后端未启动也能演示）
    if (username === "admin" && password === "123456") {
      const mockToken = "mock_jwt_token_for_demo_purpose";
      localStorage.setItem("token", mockToken);
      setAuth(mockToken, {
        userId: 1,
        userType: "ADMIN",
        name: "超级管理员",
        roleName: "超级管理员",
      });
      setIsDemo(true);
      setTimeout(() => router.push("/"), 500);
    } else {
      setError("账号或密码错误（演示模式请输入 admin / 123456）");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* 装饰背景元素 */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-green-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-100/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-lg shadow-green-200 mb-4">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">绿化工人管理系统</h1>
          <p className="text-sm text-gray-500 mt-1">管理后台登录</p>
        </div>

        <Card className="border-0 shadow-xl shadow-green-100/50 rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">欢迎回来</CardTitle>
            <CardDescription>请输入管理员账号和密码</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">账号</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入管理员账号"
                  className="h-11 rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="h-11 rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500/20 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                  {error}
                </div>
              )}

              {isDemo && (
                <div className="p-3 rounded-lg bg-amber-50 text-amber-700 text-sm">
                  后端服务未启动，已进入演示模式
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium shadow-lg shadow-green-200 transition-all"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "登 录"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-8">
          绿化工人管理系统 © 2026 · 演示账号：admin / 123456
        </p>
      </div>
    </div>
  );
}
