"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { MonthlyReportData } from "./types";

interface AttendanceTableProps {
  report: MonthlyReportData;
  exportDate: Date;
  type: "worker" | "driver";
}

export function AttendanceTable({ report, exportDate, type }: AttendanceTableProps) {
  const title = useMemo(
    () => `${report.year}年${String(report.month).padStart(2, "0")}月${type === "worker" ? "工人" : "司机"}考勤表`,
    [report, type]
  );

  const exportDateStr = useMemo(
    () =>
      `${exportDate.getFullYear()}年${String(exportDate.getMonth() + 1).padStart(2, "0")}月${String(
        exportDate.getDate()
      ).padStart(2, "0")}日`,
    [exportDate]
  );

  const dayHeaders = useMemo(() => {
    const days: number[] = [];
    for (let d = 1; d <= report.daysInMonth; d++) {
      days.push(d);
    }
    return days;
  }, [report.daysInMonth]);

  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) return "";
    const num = Number(value);
    if (num === 0) return "";
    return Number.isInteger(num) ? String(num) : num.toFixed(2);
  };

  const formatWage = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) return "";
    const num = Number(value);
    if (num === 0) return "0";
    return Number.isInteger(num) ? String(num) : num.toFixed(2);
  };

  return (
    <div className="report-sheet bg-white text-black">
      {/* 标题区域 */}
      <div className="report-header">
        <h1 className="report-title">{title}</h1>
        <div className="report-meta">
          <span>组别：{report.groupName}</span>
          <span>导出日期：{exportDateStr}</span>
        </div>
      </div>

      {/* 表格区域 */}
      <div className="report-table-wrapper">
        <table className="report-table">
          <thead>
            <tr>
              <th className="col-no">序号</th>
              <th className="col-name">姓名</th>
              {dayHeaders.map((d) => (
                <th key={d} className="col-day">
                  {d}
                </th>
              ))}
              <th className="col-days">出勤<br />天数</th>
              <th className="col-ot">加班<br />时长</th>
              <th className="col-total">合计<br />工资</th>
              <th className="col-remark">备注</th>
            </tr>
          </thead>
          <tbody>
            {report.records.map((record) => (
              <tr key={record.no}>
                <td className="text-center">{record.no}</td>
                <td className="text-center font-medium">{record.name}</td>
                {record.dailyWages.map((day) => (
                  <td key={day.day} className="text-center">
                    {!day.empty && (
                      <span className="relative inline-block">
                        {formatWage(day.wage)}
                        {day.overtimeHours > 0 && (
                          <sup className="text-[8px] leading-none ml-0.5 text-red-600">
                            +{formatNumber(day.overtimeHours)}
                          </sup>
                        )}
                      </span>
                    )}
                  </td>
                ))}
                <td className="text-center">{formatNumber(record.attendanceDays)}</td>
                <td className="text-center">{formatNumber(record.overtimeHours)}</td>
                <td className="text-center font-medium">{formatWage(record.totalWage)}</td>
                <td>{record.remark}</td>
              </tr>
            ))}

            {/* 空行 */}
            <tr className="blank-row">
              <td colSpan={dayHeaders.length + 6}>&nbsp;</td>
            </tr>
            <tr className="blank-row">
              <td colSpan={dayHeaders.length + 6}>&nbsp;</td>
            </tr>

            {/* 合计行 */}
            <tr className="summary-row">
              <td className="text-center">—</td>
              <td className="text-center font-bold">合计</td>
              {report.summary.dailyWages.map((day) => (
                <td key={day.day} className="text-center font-bold">
                  {!day.empty && formatWage(day.wage)}
                </td>
              ))}
              <td className="text-center font-bold">{formatNumber(report.summary.attendanceDays)}</td>
              <td className="text-center font-bold">{formatNumber(report.summary.overtimeHours)}</td>
              <td className="text-center font-bold">{formatWage(report.summary.totalWage)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }

          body * {
            visibility: hidden;
          }

          .report-sheet,
          .report-sheet * {
            visibility: visible;
          }

          .report-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
          }

          .report-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 10pt;
          }

          .report-table th,
          .report-table td {
            border: 0.5pt solid #333;
            padding: 4pt 2pt;
            vertical-align: middle;
            word-break: break-all;
          }

          .report-table thead th {
            background-color: #f0f0f0;
            font-weight: bold;
          }

          .summary-row td {
            background-color: #f9f9f9;
          }

          .blank-row td {
            border: none;
            height: 12pt;
          }

          .report-title {
            font-size: 16pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 8pt;
          }

          .report-meta {
            display: flex;
            justify-content: space-between;
            font-size: 10pt;
            margin-bottom: 8pt;
          }
        }
      `}</style>

      <style jsx>{`
        .report-sheet {
          padding: 16px;
          background: white;
          border-radius: 8px;
        }

        .report-header {
          margin-bottom: 16px;
        }

        .report-title {
          font-size: 20px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 8px;
        }

        .report-meta {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #333;
        }

        .report-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 12px;
        }

        .report-table th,
        .report-table td {
          border: 1px solid #d1d5db;
          padding: 4px 2px;
          vertical-align: middle;
        }

        .report-table thead th {
          background-color: #f3f4f6;
          font-weight: 600;
        }

        .col-no {
          width: 36px;
        }

        .col-name {
          width: 64px;
        }

        .col-day {
          width: 32px;
        }

        .col-days,
        .col-ot,
        .col-total {
          width: 48px;
        }

        .col-remark {
          width: auto;
        }

        .summary-row td {
          background-color: #f9fafb;
        }

        .blank-row td {
          border: none;
          height: 16px;
        }
      `}</style>
    </div>
  );
}
