export interface MonthlyReportDay {
  day: number;
  wage: number;
  overtimeHours: number;
  empty: boolean;
}

export interface MonthlyReportRecord {
  no: number;
  name: string;
  dailyWages: MonthlyReportDay[];
  attendanceDays: number;
  overtimeHours: number;
  totalWage: number;
  remark: string;
}

export interface MonthlyReportData {
  year: number;
  month: number;
  groupName: string;
  daysInMonth: number;
  records: MonthlyReportRecord[];
  summary: MonthlyReportRecord;
}
