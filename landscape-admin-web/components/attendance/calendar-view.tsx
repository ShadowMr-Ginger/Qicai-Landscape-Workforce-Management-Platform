"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CalendarDay {
  date: string;
  status: number; // 0-无记录, 1-出勤未结清, 2-出勤已结清
  recordId?: number;
  totalWage?: number;
}

interface CalendarSummary {
  totalWage: number;
  settledWage: number;
  unsettledWage: number;
}

interface CalendarViewProps {
  year: number;
  month: number;
  days: CalendarDay[];
  summary: CalendarSummary;
  title: string;
  onMonthChange: (year: number, month: number) => void;
  onDayClick?: (recordId: number) => void;
  detailContent?: React.ReactNode;
}

const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

export function CalendarView({
  year,
  month,
  days,
  summary,
  title,
  onMonthChange,
  onDayClick,
  detailContent,
}: CalendarViewProps) {
  const today = new Date();
  const currentYM = today.getFullYear() * 12 + today.getMonth();
  const viewYM = year * 12 + month - 1;
  const canGoNext = viewYM < currentYM;

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    const result: (CalendarDay | null)[] = [];
    for (let i = 0; i < startWeekday; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const day = days.find((dd) => dd.date === dateStr);
      result.push(day || { date: dateStr, status: 0 });
    }
    return result;
  }, [year, month, days]);

  const handlePrev = () => {
    if (month === 1) {
      onMonthChange(year - 1, 12);
    } else {
      onMonthChange(year, month - 1);
    }
  };

  const handleNext = () => {
    if (!canGoNext) return;
    if (month === 12) {
      onMonthChange(year + 1, 1);
    } else {
      onMonthChange(year, month + 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* 标题与翻页 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-600" />
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          <span className="text-sm text-gray-500">
            {year}年{month}月
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg" onClick={handlePrev}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 rounded-lg"
            onClick={handleNext}
            disabled={!canGoNext}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-400">应结工资</p>
          <p className="text-lg font-bold text-gray-800">¥{summary.totalWage.toFixed(2)}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-xs text-blue-400">已结工资</p>
          <p className="text-lg font-bold text-blue-700">¥{summary.settledWage.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <p className="text-xs text-green-400">未结工资</p>
          <p className="text-lg font-bold text-green-700">¥{summary.unsettledWage.toFixed(2)}</p>
        </div>
      </div>

      {/* 图例 */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>出勤未结清</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span>出勤已结清</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-200" />
          <span>未出勤</span>
        </div>
      </div>

      {/* 日历网格 */}
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-7 bg-gray-50">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => (
            <div key={idx} className="border-t border-r border-gray-50 aspect-square">
              {day && (
                <button
                  className={cn(
                    "w-full h-full flex flex-col items-center justify-center text-sm transition-colors",
                    day.status === 0 && "text-gray-400 hover:bg-gray-50",
                    day.status === 1 && "bg-green-500 text-white hover:bg-green-600 rounded-lg m-0.5",
                    day.status === 2 && "bg-blue-500 text-white hover:bg-blue-600 rounded-lg m-0.5",
                  )}
                  disabled={day.status === 0}
                  onClick={() => day.recordId && onDayClick?.(day.recordId)}
                >
                  <span className="text-xs font-medium">{new Date(day.date).getDate()}</span>
                  {day.status !== 0 && day.totalWage !== undefined && (
                    <span className="text-[10px] opacity-90">¥{day.totalWage}</span>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
