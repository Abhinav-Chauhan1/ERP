"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Eye,
  AlertTriangle,
  Shield,
  User,
  Settings,
  Database,
  FileText,
  MoreHorizontal
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'SUCCESS' | 'FAILED' | 'WARNING';
}

interface AuditLogViewerProps {
  schoolId?: string;
  showAllSchools?: boolean;
}

export function AuditLogViewer({ schoolId, showAllSchools = true }: AuditLogViewerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showLogDetails, setShowLogDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - in real implementation, this would come from API
  const auditLogs: AuditLog[] = [
    {
      id: "audit_1",
      timestamp: new Date(),
      userId: "user_1",
      userName: "John Admin",
      userRole: "SUPER_ADMIN",
      action: "SCHOOL_CREATED",
      resource: "school",
      resourceId: "school_123",
      details: {
        schoolName: "New Delhi Public School",
        schoolCode: "NDPS001",
        plan: "GROWTH"
      },
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      severity: "MEDIUM",
      status: "SUCCESS"
    },
    {
      id: "audit_2",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      userId: "user_2",
      userName: "Jane Manager",
      userRole: "SUPER_ADMIN",
      action: "SUBSCRIPTION_CANCELLED",
      resource: "subscription",
      resourceId: "sub_456",
      details: {
        schoolId: "school_456",
        reason: "Payment failure",
        refundAmount: 2500
      },
      ipAddress: "192.168.1.101",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      severity: "HIGH",
      status: "SUCCESS"
    },
    {
      id: "audit_3",
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      userId: "user_3",
      userName: "Bob Support",
      userRole: "SUPPORT",
      action: "LOGIN_FAILED",
      resource: "authentication",
      details: {
        reason: "Invalid credentials",
        attempts: 3
      },
      ipAddress: "192.168.1.102",
      userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
      severity: "CRITICAL",
      status: "FAILED"
    },
    {
      id: "audit_4",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      userId: "user_1",
      userName: "John Admin",
      userRole: "SUPER_ADMIN",
      action: "BILLING_UPDATED",
      resource: "billing",
      resourceId: "bill_789",
      details: {
        schoolId: "school_789",
        oldAmount: 1500,
        newAmount: 2500,
        reason: "Plan upgrade"
      },
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      severity: "MEDIUM",
      status: "SUCCESS"
    }
  ];

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

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN') || action.includes('AUTH')) {
      return <Shield className="h-4 w-4" />;
    }
    if (action.includes('USER') || action.includes('ADMIN')) {
      return <User className="h-4 w-4" />;
    }
    if (action.includes('SCHOOL') || action.includes('SUBSCRIPTION')) {
      return <Settings className="h-4 w-4" />;
    }
    if (action.includes('DATABASE') || action.includes('DATA')) {
      return <Database className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const handleRefreshLogs = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const handleExportLogs = async () => {
    setIsLoading(true);
    // Simulate export
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = searchTerm === "" || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === "ALL" || log.action.includes(actionFilter);
    const matchesSeverity = severityFilter === "ALL" || log.severity === severityFilter;
    const matchesStatus = statusFilter === "ALL" || log.status === statusFilter;
    
    const matchesDateRange = (!dateFrom || log.timestamp >= dateFrom) && 
                            (!dateTo || log.timestamp <= dateTo);
    
    return matchesSearch && matchesAction && matchesSeverity && matchesStatus && matchesDateRange;
  });

  const logStats = {
    total: auditLogs.length,
    success: auditLogs.filter(log => log.status === 'SUCCESS').length,
    failed: auditLogs.filter(log => log.status === 'FAILED').length,
    critical: auditLogs.filter(log => log.severity === 'CRITICAL').length,
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
            disabled={isLoading}
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
            <div className="text-2xl font-bold">{logStats.total}</div>
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
            <div className="text-2xl font-bold text-green-600">{logStats.success}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((logStats.success / logStats.total) * 100)}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{logStats.failed}</div>
            <p className="text-xs text-muted-foreground">
              Failed operations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{logStats.critical}</div>
            <p className="text-xs text-muted-foreground">
              Critical severity
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
                  <SelectItem value="LOGIN">Login Events</SelectItem>
                  <SelectItem value="SCHOOL">School Events</SelectItem>
                  <SelectItem value="SUBSCRIPTION">Subscription Events</SelectItem>
                  <SelectItem value="BILLING">Billing Events</SelectItem>
                  <SelectItem value="USER">User Events</SelectItem>
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
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Date Range:</span>
                <DatePicker
                  date={dateFrom}
                  onDateChange={setDateFrom}
                  placeholder="From date"
                />
                <DatePicker
                  date={dateTo}
                  onDateChange={setDateTo}
                  placeholder="To date"
                />
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-muted-foreground">
                  Showing {filteredLogs.length} of {auditLogs.length} events
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
                      <div>{log.timestamp.toLocaleDateString()}</div>
                      <div className="text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}
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
                      <div className="font-medium">{log.resource}</div>
                      {log.resourceId && (
                        <div className="text-sm text-muted-foreground font-mono">
                          {log.resourceId}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getSeverityColor(log.severity) as any}>
                      {log.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(log.status) as any}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{log.ipAddress}</span>
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
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Export Event
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={showLogDetails} onOpenChange={setShowLogDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Event Details</DialogTitle>
            <DialogDescription>
              {selectedLog?.action} - {selectedLog?.timestamp.toLocaleString()}
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
                  <p className="text-sm">{selectedLog.timestamp.toLocaleString()}</p>
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
                  <p className="text-sm">{selectedLog.resource}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Resource ID:</span>
                  <p className="font-mono text-sm">{selectedLog.resourceId || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">IP Address:</span>
                  <p className="font-mono text-sm">{selectedLog.ipAddress}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={getStatusColor(selectedLog.status) as any}>
                    {selectedLog.status}
                  </Badge>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium">User Agent:</span>
                <p className="text-sm text-muted-foreground break-all">{selectedLog.userAgent}</p>
              </div>

              <div>
                <span className="text-sm font-medium">Event Details:</span>
                <pre className="text-xs bg-gray-100 p-3 rounded-md overflow-auto max-h-40">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}