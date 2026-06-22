"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface DriverSalaryDefaults {
  baseDailySalary: number;
  overtimeHourlyRate: number;
}

export const DRIVER_SALARY_STORAGE_KEY = "driverDefaultSalary";

const defaultValues: DriverSalaryDefaults = {
  baseDailySalary: 300,
  overtimeHourlyRate: 50,
};

export function loadDriverSalaryDefaults(): DriverSalaryDefaults {
  if (typeof window === "undefined") return defaultValues;
  try {
    const raw = localStorage.getItem(DRIVER_SALARY_STORAGE_KEY);
    if (raw) return { ...defaultValues, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return defaultValues;
}

function saveDriverSalaryDefaults(v: DriverSalaryDefaults) {
  localStorage.setItem(DRIVER_SALARY_STORAGE_KEY, JSON.stringify(v));
}

export default function DriverSalaryDefaultsPage() {
  const [form, setForm] = useState<DriverSalaryDefaults>(defaultValues);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setForm(loadDriverSalaryDefaults());
  }, []);

  const handleSave = () => {
    saveDriverSalaryDefaults(form);
    toast.success("司机默认薪资配置已保存");
  };

  const handleReset = () => {
    setForm(defaultValues);
    saveDriverSalaryDefaults(defaultValues);
    toast.success("已恢复系统默认值");
  };

  if (!mounted) return null;

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h2 className="text-lg font-semibold text-foreground">默认薪资配置</h2>
        </div>
      </div>

      <Card className="border-0 shadow-sm rounded-xl">
        <CardContent className="p-6 space-y-6">
          <p className="text-sm text-muted-foreground">
            设置新增司机时的默认基础日薪与加班时薪。打开新增司机弹窗时，系统会自动填充以下默认值。
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>基础日薪（元）</Label>
              <Input
                type="number"
                value={form.baseDailySalary}
                onChange={(e) =>
                  setForm({ ...form, baseDailySalary: Number(e.target.value) })
                }
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label>加班时薪（元）</Label>
              <Input
                type="number"
                value={form.overtimeHourlyRate}
                onChange={(e) =>
                  setForm({ ...form, overtimeHourlyRate: Number(e.target.value) })
                }
                className="rounded-lg"
              />
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-4 text-sm text-green-800 space-y-1">
            <p className="font-medium">计算示例</p>
            <p>新增司机时默认基础日薪 ¥{form.baseDailySalary} / 天</p>
            <p>新增司机时默认加班时薪 ¥{form.overtimeHourlyRate} / 小时</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              className="rounded-lg bg-green-600 hover:bg-green-700"
              onClick={handleSave}
            >
              <Save className="w-4 h-4 mr-1" />
              保存配置
            </Button>
            <Button variant="outline" className="rounded-lg" onClick={handleReset}>
              恢复默认值
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
