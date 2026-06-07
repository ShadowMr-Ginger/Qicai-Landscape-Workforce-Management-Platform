"use client";

import { useRouter } from "next/navigation";
import {
  Users,
  UserCircle,
  ClipboardList,
  BarChart3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const entries = [
  {
    title: "工人考勤记录总表",
    desc: "按时间倒序查看所有工人的考勤明细",
    icon: ClipboardList,
    href: "/worker-records",
    color: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
  },
  {
    title: "工人考勤信息汇总",
    desc: "按组别浏览工人，查看个人出勤日历",
    icon: Users,
    href: "/worker-summary",
    color: "bg-blue-100 text-blue-700 dark:text-blue-300",
  },
  {
    title: "司机考勤记录总表",
    desc: "按时间倒序查看所有司机的考勤明细",
    icon: ClipboardList,
    href: "/driver-records",
    color: "bg-orange-100 text-orange-700 dark:text-orange-300",
  },
  {
    title: "司机考勤信息汇总",
    desc: "查看司机个人出勤日历",
    icon: BarChart3,
    href: "/driver-summary",
    color: "bg-purple-100 text-purple-700",
  },
];

export default function AttendanceRecordsPage() {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">考勤记录</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entries.map((item) => (
          <Card
            key={item.href}
            className="border-0 shadow-sm rounded-xl cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all"
            onClick={() => router.push(item.href)}
          >
            <CardContent className="p-5 flex items-start gap-4">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", item.color)}>
                <item.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
