"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import {
  getMarksAuditLogs,
  getExamsForMarksEntry,
} from "@/lib/actions/marksEntryActions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  changes: any;
  timestamp: Date;
  ipAddress: string | null;
  userAgent: string | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface Exam {
  id: string;
  title: string;
  subject: { name: string };
  examType: { name: string };
}

export function MarksAuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingExams, setIsLoadingExams] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Load exams on mount
  useEffect(() => {
    const loadExams = async () => {
      setIsLoadingExams(true);
      const result = await getExamsForMarksEntry();
      if (result.success) {
        setExams(result.data || []);
      }
      setIsLoadingExams(false);
    };
    loadExams();
  }, []);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const filters: any = {
      limit,
      offset: (currentPage - 1) * limit,
    };

    if (selectedExamId) {
      filters.examId = selectedExamId;
    }

    if (studentId) {
      filters.studentId = studentId;
    }

    if (startDate) {
      filters.startDate = new Date(startDate);
    }

    if (endDate) {
      filters.endDate = new Date(endDate);
    }

    const result = await getMarksAuditLogs(filters);

    setIsLoading(false);

    if (result.success && result.data) {
      setLogs(result.data.logs || []);
      setTotal(result.data.total || 0);
    } else {
      setError(result.error || "Failed to load audit logs");
    }
  }, [currentPage, limit, selectedExamId, studentId, startDate, endDate]);

  // Load logs when filters change
  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadLogs();
  };

  const handleClearFilters = () => {
    setSelectedExamId("");
    setStudentId("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "CREATE":
        return "default";
      case "UPDATE":
        return "secondary";
      case "DELETE":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatChanges = (changes: any) => {
    if (!changes) return "No changes recorded";

    if (changes.created) {
      return (
        <div className="space-y-1">
          <p className="font-medium text-sm">New Entry:</p>
          <pre className="text-xs bg-muted p-2 rounded overflow-auto">
            {JSON.stringify(changes.created, null, 2)}
          </pre>
        </div>
      );
    }

    if (changes.before && changes.after) {
      return (
        <div className="space-y-2">
          <div>
            <p className="font-medium text-sm">Before:</p>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
              {JSON.stringify(changes.before, null, 2)}
            </pre>
          </div>
          <div>
            <p className="font-medium text-sm">After:</p>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
              {JSON.stringify(changes.after, null, 2)}
            </pre>
          </div>
        </div>
      );
    }

    return (
      <pre className="text-xs bg-muted p-2 rounded overflow-auto">
        {JSON.stringify(changes, null, 2)}
      </pre>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="exam-filter">Exam</Label>
          {isLoadingExams ? (
            <div className="flex items-center justify-center h-10 border rounded-md">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <Select
              value={selectedExamId || "all"}
              onValueChange={(value) => setSelectedExamId(value === "all" ? "" : value)}
            >
              <SelectTrigger id="exam-filter">
                <SelectValue placeholder="All exams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All exams</SelectItem>
                {exams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    <div className="flex flex-col">
                      <span>{exam.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {exam.subject.name}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="student-filter">Student ID</Label>
          <Input
            id="student-filter"
            placeholder="Enter student ID"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="start-date">Start Date</Label>
          <div className="relative">
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="end-date">End Date</Label>
          <div className="relative">
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleClearFilters}>
          Clear Filters
        </Button>
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            "Search"
          )}
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {!isLoading && logs.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No audit logs found. Try adjusting your filters.
          </AlertDescription>
        </Alert>
      )}

      {logs.length > 0 && (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">
                      {format(new Date(log.timestamp), "MMM dd, yyyy HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {log.user.firstName} {log.user.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {log.user.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            View Changes
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Audit Log Details</DialogTitle>
                            <DialogDescription>
                              {format(new Date(log.timestamp), "MMMM dd, yyyy 'at' HH:mm:ss")}
                            </DialogDescription>
                          </DialogHeader>
                          <ScrollArea className="max-h-[500px]">
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm font-medium">User</p>
                                  <p className="text-sm text-muted-foreground">
                                    {log.user.firstName} {log.user.lastName}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Action</p>
                                  <Badge variant={getActionBadgeVariant(log.action)}>
                                    {log.action}
                                  </Badge>
                                </div>
                                {log.ipAddress && (
                                  <div>
                                    <p className="text-sm font-medium">IP Address</p>
                                    <p className="text-sm text-muted-foreground font-mono">
                                      {log.ipAddress}
                                    </p>
                                  </div>
                                )}
                                {log.resourceId && (
                                  <div>
                                    <p className="text-sm font-medium">Resource ID</p>
                                    <p className="text-sm text-muted-foreground font-mono">
                                      {log.resourceId}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium mb-2">Changes</p>
                                {formatChanges(log.changes)}
                              </div>
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * limit + 1} to{" "}
              {Math.min(currentPage * limit, total)} of {total} results
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || isLoading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
