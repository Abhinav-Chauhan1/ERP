"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Filter, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { AuditAction } from "@prisma/client";

interface AuditLog {
  id: string;
  timestamp: Date;
  action: AuditAction;
  resourceId: string;
  changes: Record<string, any>;
  ipAddress: string | null;
  userAgent: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export default function ReceiptAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [offset, setOffset] = useState(0);
  const limit = 50;

  // Fetch logs
  const fetchLogs = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const currentOffset = reset ? 0 : offset;

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: currentOffset.toString(),
      });

      if (actionFilter && actionFilter !== "all") {
        params.append("action", actionFilter);
      }
      if (startDate) {
        params.append("startDate", new Date(startDate).toISOString());
      }
      if (endDate) {
        params.append("endDate", new Date(endDate).toISOString());
      }

      const response = await fetch(`/api/admin/receipt-audit-logs?${params}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.logs);
        setTotalCount(data.totalCount);
        setHasMore(data.hasMore);
        if (reset) setOffset(0);
      } else {
        toast.error(data.error || "Failed to fetch audit logs");
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  }, [actionFilter, startDate, endDate, offset, limit]);

  // Export logs
  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (actionFilter && actionFilter !== "all") {
        params.append("action", actionFilter);
      }
      if (startDate) {
        params.append("startDate", new Date(startDate).toISOString());
      }
      if (endDate) {
        params.append("endDate", new Date(endDate).toISOString());
      }

      const response = await fetch(`/api/admin/receipt-audit-logs/export?${params}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Audit logs exported successfully");
    } catch (error) {
      console.error("Error exporting audit logs:", error);
      toast.error("Failed to export audit logs");
    }
  };

  // Load logs on mount
  useEffect(() => {
    fetchLogs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter logs locally by search query
  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.user.firstName.toLowerCase().includes(query) ||
      log.user.lastName.toLowerCase().includes(query) ||
      log.user.email.toLowerCase().includes(query) ||
      log.resourceId.toLowerCase().includes(query) ||
      (log.changes.referenceNumber && log.changes.referenceNumber.toLowerCase().includes(query))
    );
  });

  // Get action badge color
  const getActionBadgeColor = (action: AuditAction) => {
    switch (action) {
      case "VERIFY":
      case "BULK_VERIFY":
        return "bg-green-100 text-green-800";
      case "REJECT":
      case "BULK_REJECT":
        return "bg-red-100 text-red-800";
      case "UPLOAD":
      case "REUPLOAD":
        return "bg-blue-100 text-blue-800";
      case "ADD_NOTE":
      case "DELETE_NOTE":
        return "bg-purple-100 text-purple-800";
      case "VIEW":
        return "bg-gray-100 text-gray-800";
      case "EXPORT":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format action name
  const formatActionName = (action: AuditAction) => {
    return action.replace(/_/g, " ");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Receipt Audit Logs</h1>
        <p className="text-muted-foreground mt-2">
          Track all receipt-related actions for compliance and debugging
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter audit logs by action, date range, or search
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Action Filter */}
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="UPLOAD">Upload</SelectItem>
                  <SelectItem value="REUPLOAD">Re-upload</SelectItem>
                  <SelectItem value="VERIFY">Verify</SelectItem>
                  <SelectItem value="REJECT">Reject</SelectItem>
                  <SelectItem value="BULK_VERIFY">Bulk Verify</SelectItem>
                  <SelectItem value="BULK_REJECT">Bulk Reject</SelectItem>
                  <SelectItem value="ADD_NOTE">Add Note</SelectItem>
                  <SelectItem value="DELETE_NOTE">Delete Note</SelectItem>
                  <SelectItem value="VIEW">View</SelectItem>
                  <SelectItem value="EXPORT">Export</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="User, email, receipt..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={() => fetchLogs(true)} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Apply Filters
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setActionFilter("all");
                setStartDate("");
                setEndDate("");
                setSearchQuery("");
                setOffset(0);
              }}
            >
              Clear Filters
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            Audit Logs ({filteredLogs.length} of {totalCount})
          </CardTitle>
          <CardDescription>
            Showing {offset + 1} - {Math.min(offset + limit, totalCount)} of {totalCount} total logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground mt-2">Loading audit logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No audit logs found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge className={getActionBadgeColor(log.action)}>
                            {formatActionName(log.action)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {log.user.firstName} {log.user.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">{log.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {log.changes.referenceNumber && (
                              <p className="font-mono text-sm">{log.changes.referenceNumber}</p>
                            )}
                            {log.resourceId !== "BULK_OPERATION" && log.resourceId !== "EXPORT_OPERATION" && (
                              <p className="text-xs text-muted-foreground">{log.resourceId}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            {log.changes.amount && (
                              <p className="text-sm">Amount: ₹{log.changes.amount}</p>
                            )}
                            {log.changes.rejectionReason && (
                              <p className="text-sm text-red-600">
                                Reason: {log.changes.rejectionReason}
                              </p>
                            )}
                            {log.changes.successCount !== undefined && (
                              <p className="text-sm">
                                Success: {log.changes.successCount} / Fail: {log.changes.failureCount}
                              </p>
                            )}
                            {log.changes.notePreview && (
                              <p className="text-sm text-muted-foreground truncate">
                                {log.changes.notePreview}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.ipAddress || "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {(offset > 0 || hasMore) && (
                <div className="flex justify-between items-center mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setOffset(Math.max(0, offset - limit));
                      fetchLogs();
                    }}
                    disabled={offset === 0 || loading}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {Math.floor(offset / limit) + 1}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setOffset(offset + limit);
                      fetchLogs();
                    }}
                    disabled={!hasMore || loading}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
