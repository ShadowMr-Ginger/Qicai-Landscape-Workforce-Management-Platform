"use client";

import {
  Users,
  UserCircle,
  ClipboardCheck,
  Clock,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Wallet,
  Building2,
  Settings,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const stats = [
  {
    title: "工人总数",
    value: "128",
    desc: "在职工人",
    icon: Users,
    color: "from-green-500 to-green-600",
    bg: "bg-green-50",
    text: "text-green-600",
  },
  {
    title: "司机数量",
    value: "8",
    desc: "在职司机",
    icon: UserCircle,
    color: "from-emerald-500 to-emerald-600",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
  },
  {
    title: "今日考勤",
    value: "96",
    desc: "已上报 / 128",
    icon: ClipboardCheck,
    color: "from-teal-500 to-teal-600",
    bg: "bg-teal-50",
    text: "text-teal-600",
  },
  {
    title: "待审核批次",
    value: "3",
    desc: "需要尽快处理",
    icon: Clock,
    color: "from-orange-500 to-orange-600",
    bg: "bg-orange-50",
    text: "text-orange-600",
  },
];

const quickLinks = [
  { title: "工资结算", desc: "查看本月工资汇总", icon: Wallet, href: "/wages", color: "bg-green-100 text-green-700" },
  { title: "项目管理", desc: "管理工地项目", icon: Building2, href: "/projects", color: "bg-blue-100 text-blue-700" },
  { title: "系统设置", desc: "配置系统参数", icon: Settings, href: "/settings", color: "bg-gray-100 text-gray-700" },
  { title: "考勤审核", desc: "审核司机提交的考勤", icon: ClipboardCheck, href: "/batches", color: "bg-orange-100 text-orange-700" },
];

const recentActivities = [
  { action: "司机 张三 提交了今日考勤批次", time: "10 分钟前", type: "batch" },
  { action: "管理员审核通过了 李四 的考勤", time: "30 分钟前", type: "review" },
  { action: "新增工人 王五", time: "1 小时前", type: "worker" },
  { action: "工资结清：工人 赵六 2026-05", time: "2 小时前", type: "wage" },
  { action: "司机 钱七 修改了密码", time: "3 小时前", type: "driver" },
];

/**
 * Dashboard 首页
 *
 * <p>管理后台的首页，展示关键统计数据、快捷入口和最近动态。</p>
 */
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">欢迎回来，管理员</h1>
          <p className="text-sm text-gray-500 mt-1">
            今天是 {new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
          </p>
        </div>
        <Link href="/batches">
          <Button className="rounded-xl bg-green-600 hover:bg-green-700 shadow-md shadow-green-200">
            去审核考勤
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{stat.desc}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.text}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 快捷入口 */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                快捷入口
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quickLinks.map((link) => (
                  <Link key={link.title} href={link.href}>
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all group cursor-pointer">
                      <div className={`w-10 h-10 rounded-lg ${link.color} flex items-center justify-center shrink-0`}>
                        <link.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 group-hover:text-green-700 transition-colors">
                          {link.title}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{link.desc}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 最近动态 */}
        <div>
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-green-600" />
                最近动态
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 leading-relaxed">{activity.action}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 数据概览装饰卡片 */}
      <Card className="border-0 shadow-sm rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm mb-1">系统状态</p>
            <p className="text-xl font-bold">运行正常</p>
            <p className="text-green-100 text-xs mt-1">上次备份：今天 03:00</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
