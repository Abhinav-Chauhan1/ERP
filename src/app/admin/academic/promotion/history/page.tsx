"use client";

/**
 * Promotion History Page
 * 
 * Displays promotion history with filters, pagination, sorting, and export functionality.
 * 
 * Requirements: 8.4, 8.5, 8.6, 8.7
 */

import { useState, useEffect } from "react";
import { format } from "date-fns";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronRight,
  History,
  Download,
  Eye,
  Filter,
  X,
  Loader2,
  AlertCircle,
  Calendar,
  Users,
  TrendingUp,
  FileText,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { getPromotionHistory, getPromotionDetails } from "@/lib/actions/promotionActions";
import { DatePicker } from "@/components/ui/date-picker";
import toast from "react-hot-toast";

interface PromotionHistoryItem {
  id: string;
  sourceAcademicYear: string;
  sourceClass: string;
  sourceSection: string | null;
  targetAcademicYear: string;
  targetClass: string;
  targetSection: string | null;
  totalStudents: number;
  promotedStudents: number;
  excludedStudents: number;
  failedStudents: number;
  executedAt: Date;
  executedBy: string;
  notes: string | null;
}

interface PromotionDetails {
  id: string;
  sourceAcademicYear: string;
  sourceClass: string;
  sourceSection: string | null;
  targetAcademicYear: string;
  targetClass: string;
  targetSection: string | null;
  totalStudents: number;
  promotedStudents: number;
  excludedStudents: number;
  failedStudents: number;
  executedAt: Date;
  executedBy: string;
  notes: string | null;
  students: Array<{
    id: string;
    name: string;
    admissionId: string;
    status: string;
    reason: string | null;
  }>;
  failureDetails: any[];
  excludedList: any[];
}

export default function PromotionHistoryPage() {
  // State for history data
  const [history, setHistory] = useState<PromotionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });

  // State for filters
  const [filters, setFilters] = useState({
    academicYear: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });
  const [showFilters, setShowFilters] = useState(false);

  // State for detail view
  const [selectedPromotion, setSelectedPromotion] = useState<PromotionDetails | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Load history on mount and when filters/pagination change
  useEffect(() => {
    loadHistory();
  }, [pagination.page, filters]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const result = await getPromotionHistory({
        academicYear: filters.academicYear || undefined,
        startDate: filters.startDate ? filters.startDate.toISOString() : undefined,
        endDate: filters.endDate ? filters.endDate.toISOString() : undefined,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });

      if (result.success && result.data) {
        setHistory(result.data.history);
        setPagination(result.data.pagination);
      } else {
        toast.error(result.error || "Failed to load promotion history");
      }
    } catch (error) {
      console.error("Error loading promotion history:", error);
      toast.error("Failed to load promotion history");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (historyId: string) => {
    setIsLoadingDetails(true);
    setShowDetailDialog(true);

    try {
      const result = await getPromotionDetails({ historyId });

      if (result.success && result.data) {
        setSelectedPromotion(result.data);
      } else {
        toast.error(result.error || "Failed to load promotion details");
        setShowDetailDialog(false);
      }
    } catch (error) {
      console.error("Error loading promotion details:", error);
      toast.error("Failed to load promotion details");
      setShowDetailDialog(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleExport = () => {
    if (history.length === 0) {
      toast.error("No promotion history to export");
      return;
    }

    // Create CSV content
    const headers = [
      "Date",
      "Source Academic Year",
      "Source Class",
      "Source Section",
      "Target Academic Year",
      "Target Class",
      "Target Section",
      "Total Students",
      "Promoted",
      "Excluded",
      "Failed",
      "Executed By",
      "Notes",
    ];

    const rows = history.map((item) => [
      format(new Date(item.executedAt), "yyyy-MM-dd HH:mm:ss"),
      item.sourceAcademicYear,
      item.sourceClass,
      item.sourceSection || "N/A",
      item.targetAcademicYear,
      item.targetClass,
      item.targetSection || "N/A",
      item.totalStudents,
      item.promotedStudents,
      item.excludedStudents,
      item.failedStudents,
      item.executedBy,
      item.notes || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `promotion-history-${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Promotion history exported successfully");
  };

  const handleExportDetails = () => {
    if (!selectedPromotion) return;

    // Create CSV content for detailed view
    const headers = [
      "Student Name",
      "Admission ID",
      "Status",
      "Reason",
    ];

    const rows = selectedPromotion.students.map((student) => [
      student.name,
      student.admissionId,
      student.status,
      student.reason || "",
    ]);

    const csvContent = [
      `Promotion Details - ${selectedPromotion.sourceClass} to ${selectedPromotion.targetClass}`,
      `Date: ${format(new Date(selectedPromotion.executedAt), "yyyy-MM-dd HH:mm:ss")}`,
      `Executed By: ${selectedPromotion.executedBy}`,
      "",
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `promotion-details-${selectedPromotion.id}-${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Promotion details exported successfully");
  };

  const clearFilters = () => {
    setFilters({
      academicYear: "",
      startDate: undefined,
      endDate: undefined,
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters =
    filters.academicYear || filters.startDate || filters.endDate;

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link href="/admin/academic" className="hover:text-gray-900">
          Academic
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/admin/academic/promotion" className="hover:text-gray-900">
          Promotion
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium">History</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <History className="h-8 w-8" />
            Promotion History
          </h1>
          <p className="text-muted-foreground">
            View and track all student promotion operations
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full sm:w-auto"
          >
            <Filter className="mr-2 h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={history.length === 0}
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Export to CSV
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/admin/academic/promotion">
              <TrendingUp className="mr-2 h-4 w-4" />
              New Promotion
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <CardDescription>Total Promotions</CardDescription>
            </div>
            <CardTitle className="text-3xl">
              {pagination.total}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              All time records
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <CardDescription>Students Promoted</CardDescription>
            </div>
            <CardTitle className="text-3xl text-green-600">
              {history.reduce((sum, item) => sum + item.promotedStudents, 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Current page total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <CardDescription>Excluded</CardDescription>
            </div>
            <CardTitle className="text-3xl text-amber-600">
              {history.reduce((sum, item) => sum + item.excludedStudents, 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Current page total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-red-600" />
              <CardDescription>Failed</CardDescription>
            </div>
            <CardTitle className="text-3xl text-red-600">
              {history.reduce((sum, item) => sum + item.failedStudents, 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Current page total
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter promotion history by academic year and date range
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="academicYear">Academic Year</Label>
                <Input
                  id="academicYear"
                  placeholder="e.g., 2023-2024"
                  value={filters.academicYear}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      academicYear: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <DatePicker
                  date={filters.startDate}
                  onSelect={(date) =>
                    setFilters((prev) => ({ ...prev, startDate: date }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <DatePicker
                  date={filters.endDate}
                  onSelect={(date) =>
                    setFilters((prev) => ({ ...prev, endDate: date }))
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              )}
              <Button onClick={() => setPagination((prev) => ({ ...prev, page: 1 }))}>
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Promotion Records</CardTitle>
          <CardDescription>
            {hasActiveFilters
              ? "Filtered promotion history"
              : "Complete promotion history"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {hasActiveFilters
                  ? "No promotion history found matching the filters."
                  : "No promotion history found."}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Promoted</TableHead>
                      <TableHead className="text-center">Excluded</TableHead>
                      <TableHead className="text-center">Failed</TableHead>
                      <TableHead>Executed By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>
                              {format(new Date(item.executedAt), "MMM dd, yyyy")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(item.executedAt), "HH:mm:ss")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {item.sourceClass}
                              {item.sourceSection && ` - ${item.sourceSection}`}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {item.sourceAcademicYear}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {item.targetClass}
                              {item.targetSection && ` - ${item.targetSection}`}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {item.targetAcademicYear}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{item.totalStudents}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="default" className="bg-green-600">
                            {item.promotedStudents}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.excludedStudents > 0 ? (
                            <Badge variant="secondary">
                              {item.excludedStudents}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.failedStudents > 0 ? (
                            <Badge variant="destructive">
                              {item.failedStudents}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{item.executedBy}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(item.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
                    {Math.min(
                      pagination.page * pagination.pageSize,
                      pagination.total
                    )}{" "}
                    of {pagination.total} records
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page - 1,
                        }))
                      }
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="text-sm">
                      Page {pagination.page} of {pagination.totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page + 1,
                        }))
                      }
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Promotion Details</DialogTitle>
            <DialogDescription>
              Detailed information about this promotion operation
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedPromotion ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Date & Time</Label>
                  <div className="font-medium">
                    {format(
                      new Date(selectedPromotion.executedAt),
                      "MMMM dd, yyyy 'at' HH:mm:ss"
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Executed By</Label>
                  <div className="font-medium">
                    {selectedPromotion.executedBy}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Source</Label>
                  <div className="font-medium">
                    {selectedPromotion.sourceClass}
                    {selectedPromotion.sourceSection &&
                      ` - ${selectedPromotion.sourceSection}`}
                    <div className="text-sm text-muted-foreground">
                      {selectedPromotion.sourceAcademicYear}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Target</Label>
                  <div className="font-medium">
                    {selectedPromotion.targetClass}
                    {selectedPromotion.targetSection &&
                      ` - ${selectedPromotion.targetSection}`}
                    <div className="text-sm text-muted-foreground">
                      {selectedPromotion.targetAcademicYear}
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Students</CardDescription>
                    <CardTitle className="text-2xl">
                      {selectedPromotion.totalStudents}
                    </CardTitle>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Promoted</CardDescription>
                    <CardTitle className="text-2xl text-green-600">
                      {selectedPromotion.promotedStudents}
                    </CardTitle>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Excluded</CardDescription>
                    <CardTitle className="text-2xl text-amber-600">
                      {selectedPromotion.excludedStudents}
                    </CardTitle>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Failed</CardDescription>
                    <CardTitle className="text-2xl text-red-600">
                      {selectedPromotion.failedStudents}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {/* Notes */}
              {selectedPromotion.notes && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Notes</Label>
                  <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                    {selectedPromotion.notes}
                  </div>
                </div>
              )}

              {/* Student List */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Student Records</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportDetails}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
                <div className="rounded-md border max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Admission ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPromotion.students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            {student.name}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {student.admissionId}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                student.status === "PROMOTED"
                                  ? "default"
                                  : student.status === "EXCLUDED"
                                    ? "secondary"
                                    : "destructive"
                              }
                              className={
                                student.status === "PROMOTED"
                                  ? "bg-green-600"
                                  : ""
                              }
                            >
                              {student.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {student.reason || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
