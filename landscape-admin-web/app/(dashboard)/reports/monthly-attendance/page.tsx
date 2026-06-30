"use client";

import Link from "next/link";
import { Users, UserCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MonthlyAttendanceEntryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">月度考勤表导出</h2>
          <p className="text-sm text-muted-foreground mt-1">请选择需要导出的考勤表类型</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/reports/monthly-attendance/worker">
          <Card className="border-0 shadow-sm rounded-xl hover:shadow-md hover:border-green-200 dark:hover:border-green-900 transition-all cursor-pointer h-full">
            <CardContent className="p-8 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
                <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">工人考勤表</h3>
                <p className="text-sm text-muted-foreground mt-1">按组别导出工人月度考勤与工资汇总</p>
              </div>
              <Button variant="outline" className="mt-2">进入</Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports/monthly-attendance/driver">
          <Card className="border-0 shadow-sm rounded-xl hover:shadow-md hover:border-green-200 dark:hover:border-green-900 transition-all cursor-pointer h-full">
            <CardContent className="p-8 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
                <UserCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">司机考勤表</h3>
                <p className="text-sm text-muted-foreground mt-1">导出司机月度考勤与工资汇总</p>
              </div>
              <Button variant="outline" className="mt-2">进入</Button>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
