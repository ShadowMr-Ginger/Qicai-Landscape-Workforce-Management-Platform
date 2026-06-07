"use client";

import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * 开发中占位组件
 *
 * <p>用于尚未开发完成的页面，展示友好的"开发中"提示，避免空白页面。</p>
 */
export function DevPlaceholder({ title = "页面开发中" }: { title?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-md border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 rounded-full bg-green-50 dark:bg-green-950/30 flex items-center justify-center mb-6">
            <Construction className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
          <p className="text-sm text-muted-foreground text-center">
            该功能正在紧锣密鼓开发中，敬请期待
          </p>
          <div className="mt-6 flex gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-bounce [animation-delay:-0.3s]" />
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-bounce [animation-delay:-0.15s]" />
            <span className="inline-block w-2 h-2 rounded-full bg-green-600 animate-bounce" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
