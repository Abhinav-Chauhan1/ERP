"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Search,
  Download,
  RefreshCw,
  Eye,
  AlertTriangle,
  Shield,
  User,
  Settings,
  Database,
  FileText,
  MoreHorizontal,
  LogIn,
  LogOut,
  Plus,
  Trash2,
  Edit,
  Upload,
  CheckCircle
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AuditAction } from "@prisma/client";
import {
  getAuditLogs,
  getAuditLogStats,
  exportAuditLogs,
  type AuditLogWithUser,
  type AuditLogStats
} from "@/lib/actions/audit-log-actions";
import { toast } from "sonner";

interface AuditLogViewerProps {
  schoolId?: string;
  showAllSchools?: boolean;
  limit?: number;
}

// Map actions to severity levels
function getActionSeverity(action: AuditAction): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  const criticalActions: AuditAction[] = [AuditAction.DELETE, AuditAction.BULK_REJECT];
  const highActions: AuditAction[] = [AuditAction.UPDATE, AuditAction.APPROVE, AuditAction.REJECT];
  const mediumActions: AuditAction[] = [AuditAction.CREATE, AuditAction.IMPORT, AuditAction.EXPORT];

  if (criticalActions.includes(action)) return "CRITICAL";
  if (highActions.includes(action)) return "HIGH";
  if (mediumActions.includes(action)) return "MEDIUM";
  return "LOW";
}

// Map actions to status
function getActionStatus(action: AuditAction): "SUCCESS" | "FAILED" | "WARNING" {
  const warningActions: AuditAction[] = [AuditAction.REJECT, AuditAction.BULK_REJECT];
  if (warningActions.includes(action)) return "WARNING";
  return "SUCCESS";
}

export function AuditLogViewer({ schoolId, showAllSchools = true, limit = 50 }: AuditLogViewerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [selectedLog, setSelectedLog] = useState<AuditLogWithUser | null>(null);
  const [showLogDetails, setShowLogDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Real data state
  const [auditLogs, setAuditLogs] = useState<AuditLogWithUser[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [logsResult, statsResult] = await Promise.all([
        getAuditLogs({
          search: searchTerm || undefined,
          action: actionFilter !== "ALL" ? actionFilter : undefined,
          severity: severityFilter !== "ALL" ? severityFilter : undefined,
          dateFrom,
          dateTo,
          limit,
          offset: 0,
          schoolId,
        }),
        getAuditLogStats({ schoolId, dateFrom, dateTo }),
      ]);

      if (logsResult.success && logsResult.data) {
        setAuditLogs(logsResult.data);
        setTotal(logsResult.total || 0);
      }

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, actionFilter, severityFilter, dateFrom, dateTo, limit, schoolId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW':
        return 'default';
      case 'MEDIUM':
        return 'secondary';
      case 'HIGH':
        return 'destructive';
      case 'CRITICAL':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'default';
      case 'FAILED':
        return 'destructive';
      case 'WARNING':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getActionIcon = (action: AuditAction) => {
    switch (action) {
      case AuditAction.LOGIN:
        return <LogIn className="h-4 w-4" />;
      case AuditAction.LOGOUT:
        return <LogOut className="h-4 w-4" />;
      case AuditAction.CREATE:
        return <Plus className="h-4 w-4" />;
      case AuditAction.DELETE:
        return <Trash2 className="h-4 w-4" />;
      case AuditAction.UPDATE:
        return <Edit className="h-4 w-4" />;
      case AuditAction.READ:
      case AuditAction.VIEW:
        return <Eye className="h-4 w-4" />;
      case AuditAction.UPLOAD:
      case AuditAction.REUPLOAD:
        return <Upload className="h-4 w-4" />;
      case AuditAction.APPROVE:
      case AuditAction.VERIFY:
        return <CheckCircle className="h-4 w-4" />;
      case AuditAction.REJECT:
        return <AlertTriangle className="h-4 w-4" />;
      case AuditAction.EXPORT:
      case AuditAction.IMPORT:
        return <Database className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleRefreshLogs = async () => {
    await fetchData();
    toast.success("Logs refreshed");
  };

  const handleExportLogs = async () => {
    setIsExporting(true);
    try {
      const result = await exportAuditLogs({
        search: searchTerm || undefined,
        action: actionFilter !== "ALL" ? actionFilter : undefined,
        dateFrom,
        dateTo,
        schoolId,
        format: "csv",
      });

      if (result.success && result.data) {
        // Create download
        const blob = new Blob([result.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("Export downloaded successfully");
      } else {
        toast.error(result.error || "Failed to export logs");
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export logs");
    } finally {
      setIsExporting(false);
    }
  };

  // Apply client-side status filter
  const filteredLogs = auditLogs.filter(log => {
    if (statusFilter !== "ALL") {
      const status = getActionStatus(log.action);
      if (status !== statusFilter) return false;
    }
    return true;
  });

  const logStats = stats || {
    total: 0,
    success: 0,
    failed: 0,
    critical: 0,
    byAction: {},
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Audit Log Viewer</h2>
          <p className="text-muted-foreground">
            {showAllSchools ? "System-wide audit trail" : "School-specific audit logs"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshLogs}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportLogs}
            disabled={isLoading || isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Audit Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logStats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All audit events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{logStats.success.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {logStats.total > 0 ? Math.round((logStats.success / logStats.total) * 100) : 0}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{logStats.failed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Warning events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{logStats.critical.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              High-impact actions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by action, user, or resource..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Actions</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="READ">Read</SelectItem>
                  <SelectItem value="EXPORT">Export</SelectItem>
                  <SelectItem value="IMPORT">Import</SelectItem>
                  <SelectItem value="APPROVE">Approve</SelectItem>
                  <SelectItem value="REJECT">Reject</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Severities</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Date Range:</span>
                <DatePicker
                  date={dateFrom}
                  onSelect={setDateFrom}
                  placeholder="From date"
                />
                <DatePicker
                  date={dateTo}
                  onSelect={setDateTo}
                  placeholder="To date"
                />
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-muted-foreground">
                  Showing {filteredLogs.length} of {total} events
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Events ({filteredLogs.length})</CardTitle>
          <CardDescription>Comprehensive audit trail with advanced filtering</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading audit logs...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4" />
              <p>No audit logs found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                        <div className="text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.userName}</div>
                        <div className="text-sm text-muted-foreground">{log.userRole}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="font-mono text-sm">{log.action}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.resource || "N/A"}</div>
                        {log.resourceId && (
                          <div className="text-sm text-muted-foreground font-mono">
                            {log.resourceId.slice(0, 8)}...
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSeverityColor(getActionSeverity(log.action)) as "default" | "secondary" | "destructive" | "outline"}>
                        {getActionSeverity(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(getActionStatus(log.action)) as "default" | "secondary" | "destructive" | "outline"}>
                        {getActionStatus(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{log.ipAddress || "N/A"}</span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedLog(log);
                            setShowLogDetails(true);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={showLogDetails} onOpenChange={setShowLogDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Event Details</DialogTitle>
            <DialogDescription>
              {selectedLog?.action} - {selectedLog?.timestamp && new Date(selectedLog.timestamp).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium">Event ID:</span>
                  <p className="font-mono text-sm">{selectedLog.id}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Timestamp:</span>
                  <p className="text-sm">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">User:</span>
                  <p className="text-sm">{selectedLog.userName} ({selectedLog.userRole})</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Action:</span>
                  <p className="font-mono text-sm">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Resource:</span>
                  <p className="text-sm">{selectedLog.resource || "N/A"}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Resource ID:</span>
                  <p className="font-mono text-sm">{selectedLog.resourceId || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">IP Address:</span>
                  <p className="font-mono text-sm">{selectedLog.ipAddress || "N/A"}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">School:</span>
                  <p className="text-sm">{selectedLog.schoolName || "System-wide"}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Severity:</span>
                  <Badge variant={getSeverityColor(getActionSeverity(selectedLog.action)) as "default" | "secondary" | "destructive" | "outline"}>
                    {getActionSeverity(selectedLog.action)}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={getStatusColor(getActionStatus(selectedLog.action)) as "default" | "secondary" | "destructive" | "outline"}>
                    {getActionStatus(selectedLog.action)}
                  </Badge>
                </div>
              </div>

              {selectedLog.userAgent && (
                <div>
                  <span className="text-sm font-medium">User Agent:</span>
                  <p className="text-sm text-muted-foreground break-all">{selectedLog.userAgent}</p>
                </div>
              )}

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <span className="text-sm font-medium">Event Details:</span>
                  <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded-md overflow-auto max-h-40 mt-1">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}