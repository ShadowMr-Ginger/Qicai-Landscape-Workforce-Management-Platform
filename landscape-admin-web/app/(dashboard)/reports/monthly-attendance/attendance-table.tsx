"use client";

import { useMemo } from "react";
import {
  Document,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  WidthType,
  AlignmentType,
  HeadingLevel,
  Packer,
  BorderStyle,
  TextRun,
} from "docx";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  // 格式化数字：整数不显示小数，非整数显示一位小数
  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) return "";
    const num = Number(value);
    if (num === 0) return "";
    return Number.isInteger(num) ? String(num) : num.toFixed(1);
  };

  const formatWage = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) return "";
    const num = Number(value);
    if (num === 0) return "0";
    return Number.isInteger(num) ? String(num) : num.toFixed(1);
  };

  const exportToWord = async () => {
    const rows: TableRow[] = [];

    // 表头
    const headerCells = [
      new TableCell({
        children: [new Paragraph({ text: "序号", alignment: AlignmentType.CENTER })],
        width: { size: 6, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({ text: "姓名", alignment: AlignmentType.CENTER })],
        width: { size: 10, type: WidthType.PERCENTAGE },
      }),
      ...dayHeaders.map((d) =>
        new TableCell({
          children: [new Paragraph({ text: String(d), alignment: AlignmentType.CENTER })],
          width: { size: 2.2, type: WidthType.PERCENTAGE },
        })
      ),
      new TableCell({
        children: [new Paragraph({ text: "出勤天数", alignment: AlignmentType.CENTER })],
        width: { size: 7, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({ text: "加班时长", alignment: AlignmentType.CENTER })],
        width: { size: 7, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({ text: "合计工资", alignment: AlignmentType.CENTER })],
        width: { size: 8, type: WidthType.PERCENTAGE },
      }),
    ];
    rows.push(
      new TableRow({
        children: headerCells,
        tableHeader: true,
      })
    );

    // 数据行
    for (const record of report.records) {
      const cells = [
        new TableCell({
          children: [new Paragraph({ text: String(record.no), alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          children: [new Paragraph({ text: record.name, alignment: AlignmentType.CENTER })],
        }),
        ...record.dailyWages.map((day) => {
          const text = day.empty
            ? ""
            : `${formatWage(day.wage)}${day.overtimeHours > 0 ? `+${formatNumber(day.overtimeHours)}` : ""}`;
          return new TableCell({
            children: [new Paragraph({ text, alignment: AlignmentType.CENTER })],
          });
        }),
        new TableCell({
          children: [new Paragraph({ text: formatNumber(record.attendanceDays), alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          children: [new Paragraph({ text: formatNumber(record.overtimeHours), alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          children: [new Paragraph({ text: formatWage(record.totalWage), alignment: AlignmentType.CENTER })],
        }),
      ];
      rows.push(new TableRow({ children: cells }));
    }

    // 空行
    rows.push(
      new TableRow({
        children: headerCells.map(() =>
          new TableCell({
            children: [new Paragraph("")],
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
          })
        ),
      })
    );
    rows.push(
      new TableRow({
        children: headerCells.map(() =>
          new TableCell({
            children: [new Paragraph("")],
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
          })
        ),
      })
    );

    // 合计行
    const summaryCells = [
      new TableCell({
        children: [new Paragraph({ text: "—", alignment: AlignmentType.CENTER })],
      }),
      new TableCell({
        children: [new Paragraph({ text: "合计", alignment: AlignmentType.CENTER })],
      }),
      ...report.summary.dailyWages.map((day) =>
        new TableCell({
          children: [new Paragraph({ text: day.empty ? "" : formatWage(day.wage), alignment: AlignmentType.CENTER })],
        })
      ),
      new TableCell({
        children: [new Paragraph({ text: formatNumber(report.summary.attendanceDays), alignment: AlignmentType.CENTER })],
      }),
      new TableCell({
        children: [new Paragraph({ text: formatNumber(report.summary.overtimeHours), alignment: AlignmentType.CENTER })],
      }),
      new TableCell({
        children: [new Paragraph({ text: formatWage(report.summary.totalWage), alignment: AlignmentType.CENTER })],
      }),
    ];
    rows.push(new TableRow({ children: summaryCells }));

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720,
                right: 720,
                bottom: 720,
                left: 720,
              },
              size: {
                orientation: "landscape",
                width: 16838,
                height: 11906,
              },
            },
          },
          children: [
            new Paragraph({
              text: title,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `组别：${report.groupName}` }),
                new TextRun({ text: `导出日期：${exportDateStr}` }),
              ],
              alignment: AlignmentType.BOTH,
              spacing: { after: 200 },
            }),
            new Table({
              rows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end print:hidden">
        <Button onClick={exportToWord}>
          <FileDown className="w-4 h-4 mr-2" />
          导出 Word
        </Button>
      </div>

      <div className="report-sheet bg-white text-black overflow-x-auto">
        {/* 标题区域 */}
        <div className="report-header">
          <h1 className="report-title">{title}</h1>
          <div className="report-meta">
            <span>组别：{report.groupName}</span>
            <span>导出日期：{exportDateStr}</span>
          </div>
        </div>

        {/* 表格区域 */}
        <div className="report-table-wrapper min-w-max">
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
              </tr>
            </thead>
            <tbody>
              {report.records.map((record) => (
                <tr key={record.no}>
                  <td className="text-center">{record.no}</td>
                  <td className="text-center font-medium">{record.name}</td>
                  {record.dailyWages.map((day) => (
                    <td key={day.day} className="text-center cell-wage">
                      {!day.empty && (
                        <span className="wage-text">
                          {formatWage(day.wage)}
                          {day.overtimeHours > 0 && (
                            <sup className="overtime-sup">+{formatNumber(day.overtimeHours)}</sup>
                          )}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="text-center">{formatNumber(record.attendanceDays)}</td>
                  <td className="text-center">{formatNumber(record.overtimeHours)}</td>
                  <td className="text-center font-medium">{formatWage(record.totalWage)}</td>
                </tr>
              ))}

              {/* 空行 */}
              <tr className="blank-row">
                <td colSpan={dayHeaders.length + 5}>&nbsp;</td>
              </tr>
              <tr className="blank-row">
                <td colSpan={dayHeaders.length + 5}>&nbsp;</td>
              </tr>

              {/* 合计行 */}
              <tr className="summary-row">
                <td className="text-center">—</td>
                <td className="text-center font-bold">合计</td>
                {report.summary.dailyWages.map((day) => (
                  <td key={day.day} className="text-center font-bold cell-wage">
                    {!day.empty && <span className="wage-text">{formatWage(day.wage)}</span>}
                  </td>
                ))}
                <td className="text-center font-bold">{formatNumber(report.summary.attendanceDays)}</td>
                <td className="text-center font-bold">{formatNumber(report.summary.overtimeHours)}</td>
                <td className="text-center font-bold">{formatWage(report.summary.totalWage)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm 10mm 10mm 10mm;
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
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 11px;
          min-width: 100%;
        }

        .report-table th,
        .report-table td {
          border: 1px solid #d1d5db;
          padding: 3px 1px;
          vertical-align: middle;
        }

        .report-table thead th {
          background-color: #f3f4f6;
          font-weight: 600;
        }

        .cell-wage {
          white-space: nowrap;
        }

        .wage-text {
          display: inline;
          font-size: 9px;
          white-space: nowrap;
          line-height: 1;
        }

        .overtime-sup {
          font-size: 7px;
          color: #dc2626;
          margin-left: 1px;
          line-height: 1;
          vertical-align: super;
        }

        .col-no {
          width: 36px;
        }

        .col-name {
          width: 64px;
        }

        .col-day {
          width: 28px;
        }

        .col-days,
        .col-ot,
        .col-total {
          width: 48px;
        }

        .summary-row td {
          background-color: #f9fafb;
        }

        .blank-row td {
          border: none;
          height: 14px;
        }
      `}</style>
    </div>
  );
}
