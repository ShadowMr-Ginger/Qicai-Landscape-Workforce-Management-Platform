"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface SalaryDefaults {
  maleBase: number;
  femaleBase: number;
  overtimeRate: number;
  skilledExtra: number;
}

const STORAGE_KEY = "workerDefaultSalary";

const defaultValues: SalaryDefaults = {
  maleBase: 120,
  femaleBase: 90,
  overtimeRate: 15,
  skilledExtra: 30,
};

function loadDefaults(): SalaryDefaults {
  if (typeof window === "undefined") return defaultValues;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultValues, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return defaultValues;
}

function saveDefaults(v: SalaryDefaults) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
}

export default function SalaryDefaultsPage() {
  const [form, setForm] = useState<SalaryDefaults>(defaultValues);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setForm(loadDefaults());
  }, []);

  const handleSave = () => {
    saveDefaults(form);
    toast.success("默认薪资配置已保存");
  };

  const handleReset = () => {
    setForm(defaultValues);
    saveDefaults(defaultValues);
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
            设置新增工人时的默认薪资规则。选择性别和技术工状态后，系统会自动计算并填充基础日薪与加班时薪。
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>男工基础日薪（元）</Label>
              <Input
                type="number"
                value={form.maleBase}
                onChange={(e) =>
                  setForm({ ...form, maleBase: Number(e.target.value) })
                }
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label>女工基础日薪（元）</Label>
              <Input
                type="number"
                value={form.femaleBase}
                onChange={(e) =>
                  setForm({ ...form, femaleBase: Number(e.target.value) })
                }
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label>加班时薪（元）</Label>
              <Input
                type="number"
                value={form.overtimeRate}
                onChange={(e) =>
                  setForm({ ...form, overtimeRate: Number(e.target.value) })
                }
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label>技术工人额外补贴（元）</Label>
              <Input
                type="number"
                value={form.skilledExtra}
                onChange={(e) =>
                  setForm({ ...form, skilledExtra: Number(e.target.value) })
                }
                className="rounded-lg"
              />
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-4 text-sm text-green-800 space-y-1">
            <p className="font-medium">计算示例</p>
            <p>男工 + 非技术 = ¥{form.maleBase} / 天</p>
            <p>男工 + 技术工 = ¥{form.maleBase + form.skilledExtra} / 天</p>
            <p>女工 + 非技术 = ¥{form.femaleBase} / 天</p>
            <p>女工 + 技术工 = ¥{form.femaleBase + form.skilledExtra} / 天</p>
            <p>加班时薪统一为 ¥{form.overtimeRate} / 小时</p>
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
