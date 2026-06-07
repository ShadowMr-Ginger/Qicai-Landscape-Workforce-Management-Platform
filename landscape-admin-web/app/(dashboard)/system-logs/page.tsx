"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSystemLogs } from "@/lib/api";
import { cn } from "@/lib/utils";

interface LogItem {
  id: number;
  userType: string;
  userId: number;
  userName: string;
  action: string;
  targetType: string;
  targetId: number;
  detail: string;
  ipAddress: string;
  result: string;
  createTime: string;
}

const actionLabels: Record<string, string> = {
  LOGIN: "登录",
  LOGOUT: "退出",
  CREATE: "新增",
  UPDATE: "修改",
  DELETE: "删除",
  SETTLE: "结算",
  REVIEW: "审核",
  OTHER: "其他",
};

const actionColors: Record<string, string> = {
  LOGIN: "bg-blue-100 text-blue-700 dark:text-blue-300",
  LOGOUT: "bg-muted text-foreground/90",
  CREATE: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
  UPDATE: "bg-yellow-100 text-yellow-700",
  DELETE: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
  SETTLE: "bg-purple-100 text-purple-700",
  REVIEW: "bg-orange-100 text-orange-700 dark:text-orange-300",
  OTHER: "bg-slate-100 text-slate-700",
};

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);

  const [userType, setUserType] = useState("");
  const [action, setAction] = useState("");
  const [keyword, setKeyword] = useState("");

  const fetchLogs = async (page = pageNum) => {
    setLoading(true);
    try {
      const res = await getSystemLogs({
        pageNum: page,
        pageSize,
        userType: userType || undefined,
        action: action || undefined,
      });
      if (res.code === 200 && res.data) {
        setLogs(res.data.records || []);
        setTotal(res.data.total || 0);
        setPages(res.data.pages || 0);
        setPageNum(page);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "获取系统日志失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    fetchLogs(1);
  };

  const handleReset = () => {
    setUserType("");
    setAction("");
    setKeyword("");
    fetchLogs(1);
  };

  const filteredLogs = keyword
    ? logs.filter(
        (l) =>
          (l.detail && l.detail.includes(keyword)) ||
          (l.userName && l.userName.includes(keyword)) ||
          (l.targetType && l.targetType.includes(keyword))
      )
    : logs;

  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
          <FileText className="w-5 h-5 text-green-700 dark:text-green-300" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">系统日志</h2>
          <p className="text-sm text-muted-foreground">记录管理员和司机的关键操作</p>
        </div>
      </div>

      {/* 筛选栏 */}
      <Card className="border-0 shadow-sm rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* 用户类型 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">角色:</span>
              <div className="flex gap-1">
                {[
                  { value: "", label: "全部" },
                  { value: "ADMIN", label: "管理员" },
                  { value: "DRIVER", label: "司机" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setUserType(opt.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      userType === opt.value
                        ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                        : "bg-muted/30 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 操作类型 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">操作:</span>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-sm border border-border bg-card text-foreground/90 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              >
                <option value="">全部操作</option>
                {Object.entries(actionLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* 关键词搜索 */}
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="搜索内容、用户或模块..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-9"
              />
            </div>

            <Button
              size="sm"
              onClick={handleSearch}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              查询
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="text-muted-foreground"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 日志表格 */}
      <Card className="border-0 shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-background/50 hover:bg-background/50">
                <TableHead className="text-xs font-semibold text-muted-foreground w-36">时间</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground w-24">用户</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground w-20">角色</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground w-20">操作</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground w-28">模块</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">内容</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground w-16">结果</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground w-28">IP地址</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-muted rounded animate-pulse w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground/70">
                    暂无日志记录
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-background/50">
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {log.createTime
                        ? new Date(log.createTime).toLocaleString("zh-CN")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-foreground font-medium">
                      {log.userName || `用户${log.userId}`}
                    </TableCell>
                    <TableCell>
                      {log.userType === "ADMIN" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3" />
                          管理员
                        </span>
                      ) : log.userType === "DRIVER" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded-full">
                          <UserCircle className="w-3 h-3" />
                          司机
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">{log.userType}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px] font-medium border-0",
                          actionColors[log.action] || "bg-muted text-foreground/90"
                        )}
                      >
                        {actionLabels[log.action] || log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.targetType || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-foreground/90 max-w-xs truncate" title={log.detail}>
                      {log.detail || "-"}
                    </TableCell>
                    <TableCell>
                      {log.result === "SUCCESS" || log.result === null || log.result === undefined ? (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">成功</span>
                      ) : (
                        <span className="text-xs text-red-600 dark:text-red-400 font-medium">失败</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground/70 font-mono">
                      {log.ipAddress || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 分页 */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            共 <span className="font-medium text-foreground/90">{total}</span> 条记录，
            第 <span className="font-medium text-foreground/90">{pageNum}</span> / {pages} 页
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLogs(pageNum - 1)}
              disabled={pageNum <= 1 || loading}
              className="text-muted-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLogs(pageNum + 1)}
              disabled={pageNum >= pages || loading}
              className="text-muted-foreground"
            >
              下一页
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
