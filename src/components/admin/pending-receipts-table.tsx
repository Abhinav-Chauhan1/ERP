"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Download,
} from "lucide-react";
import { getPendingReceipts, getVerificationStats, bulkVerifyReceipts, bulkRejectReceipts } from "@/lib/actions/receiptVerificationActions";
import toast from "react-hot-toast";

import { ResponsiveTable } from "@/components/shared/responsive-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { getCloudinaryThumb } from "@/lib/cloudinary";

interface PendingReceipt {
  id: string;
  referenceNumber: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  createdAt: Date;
  receiptImageUrl: string;
  student: {
    id: string;
    user: {
      firstName: string | null;
      lastName: string | null;
    };
    enrollments: Array<{
      class: {
        name: string;
      };
      section: {
        name: string;
      };
    }>;
  };
  feeStructure: {
    name: string;
  };
}

interface VerificationStats {
  pendingCount: number;
  verifiedCount: number;
  rejectedCount: number;
  totalAmount: number;
}

interface PendingReceiptsTableProps {
  onVerify?: (receiptId: string) => void;
  onReject?: (receiptId: string) => void;
}

export function PendingReceiptsTable({ onVerify, onReject }: PendingReceiptsTableProps) {
  const [receipts, setReceipts] = useState<PendingReceipt[]>([]);
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Advanced filters
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("ALL");
  const [amountMinFilter, setAmountMinFilter] = useState("");
  const [amountMaxFilter, setAmountMaxFilter] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Bulk selection state
  const [selectedReceipts, setSelectedReceipts] = useState<Set<string>>(new Set());
  const [showBulkVerifyDialog, setShowBulkVerifyDialog] = useState(false);
  const [showBulkRejectDialog, setShowBulkRejectDialog] = useState(false);
  const [bulkRejectionReason, setBulkRejectionReason] = useState("");
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const loadStats = async () => {
    setIsLoadingStats(true);
    const result = await getVerificationStats();
    if (result.success && result.data) {
      setStats(result.data);
    }
    setIsLoadingStats(false);
  };

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  // Load receipts when filters change
  const loadReceipts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const filters: any = {
      limit,
      offset: (currentPage - 1) * limit,
    };

    if (startDate) {
      filters.dateFrom = new Date(startDate);
    }

    if (endDate) {
      filters.dateTo = new Date(endDate);
    }

    const result = await getPendingReceipts(filters);

    setIsLoading(false);

    if (result.success && result.data) {
      let filteredReceipts = result.data;

      // Apply client-side search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredReceipts = filteredReceipts.filter((receipt: PendingReceipt) => {
          const firstName = receipt.student.user.firstName || "";
          const lastName = receipt.student.user.lastName || "";
          const studentName = `${firstName} ${lastName}`.toLowerCase();
          const reference = receipt.referenceNumber.toLowerCase();
          return studentName.includes(query) || reference.includes(query);
        });
      }

      // Apply payment method filter
      if (paymentMethodFilter !== "ALL") {
        filteredReceipts = filteredReceipts.filter(
          (receipt: PendingReceipt) => receipt.paymentMethod === paymentMethodFilter
        );
      }

      // Apply amount range filter
      if (amountMinFilter) {
        const minAmount = parseFloat(amountMinFilter);
        if (!isNaN(minAmount)) {
          filteredReceipts = filteredReceipts.filter(
            (receipt: PendingReceipt) => receipt.amount >= minAmount
          );
        }
      }

      if (amountMaxFilter) {
        const maxAmount = parseFloat(amountMaxFilter);
        if (!isNaN(maxAmount)) {
          filteredReceipts = filteredReceipts.filter(
            (receipt: PendingReceipt) => receipt.amount <= maxAmount
          );
        }
      }

      setReceipts(filteredReceipts);
    } else {
      setError(result.error || "Failed to load pending receipts");
    }
  }, [currentPage, limit, startDate, endDate, searchQuery, paymentMethodFilter, amountMinFilter, amountMaxFilter]);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadReceipts();
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setPaymentMethodFilter("ALL");
    setAmountMinFilter("");
    setAmountMaxFilter("");
    setCurrentPage(1);
  };

  const handleVerify = (receiptId: string) => {
    if (onVerify) {
      onVerify(receiptId);
    }
  };

  const handleReject = (receiptId: string) => {
    if (onReject) {
      onReject(receiptId);
    }
  };

  const handleDownloadReceipt = (receiptUrl: string, referenceNumber: string) => {
    // Open in new tab for download
    window.open(receiptUrl, "_blank");
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedReceipts.size === receipts.length) {
      setSelectedReceipts(new Set());
    } else {
      setSelectedReceipts(new Set(receipts.map(r => r.id)));
    }
  };

  const handleSelectReceipt = (receiptId: string) => {
    const newSelected = new Set(selectedReceipts);
    if (newSelected.has(receiptId)) {
      newSelected.delete(receiptId);
    } else {
      newSelected.add(receiptId);
    }
    setSelectedReceipts(newSelected);
  };

  const handleBulkVerify = async () => {
    setIsBulkProcessing(true);
    const result = await bulkVerifyReceipts(Array.from(selectedReceipts));
    setIsBulkProcessing(false);

    if (result.success) {
      toast.success(result.message || "Receipts verified successfully");
      setSelectedReceipts(new Set());
      setShowBulkVerifyDialog(false);
      loadReceipts();
      loadStats();
    } else {
      toast.error(result.error || "Failed to verify receipts");
    }
  };

  const handleBulkReject = async () => {
    if (!bulkRejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setIsBulkProcessing(true);
    const result = await bulkRejectReceipts(
      Array.from(selectedReceipts),
      bulkRejectionReason
    );
    setIsBulkProcessing(false);

    if (result.success) {
      toast.success(result.message || "Receipts rejected successfully");
      setSelectedReceipts(new Set());
      setBulkRejectionReason("");
      setShowBulkRejectDialog(false);
      loadReceipts();
      loadStats();
    } else {
      toast.error(result.error || "Failed to reject receipts");
    }
  };

  const isAllSelected = receipts.length > 0 && selectedReceipts.size === receipts.length;

  const columns = [
    {
      key: "select",
      label: (
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={handleSelectAll}
          aria-label="Select all receipts"
        />
      ),
      className: "w-[40px]",
      mobileLabel: "Select",
      render: (receipt: PendingReceipt) => (
        <Checkbox
          checked={selectedReceipts.has(receipt.id)}
          onCheckedChange={() => handleSelectReceipt(receipt.id)}
          aria-label={`Select receipt ${receipt.referenceNumber}`}
        />
      ),
    },
    {
      key: "reference",
      label: "Reference",
      render: (receipt: PendingReceipt) => <span className="font-mono text-xs">{receipt.referenceNumber}</span>,
      mobilePriority: "low" as const,
    },
    {
      key: "student",
      label: "Student",
      isHeader: true,
      render: (receipt: PendingReceipt) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {(receipt.student.user.firstName || "")} {(receipt.student.user.lastName || "")}
          </span>
          <span className="text-xs text-muted-foreground">
            {receipt.feeStructure.name}
          </span>
        </div>
      ),
      mobileRender: (receipt: PendingReceipt) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {(receipt.student.user.firstName || "")} {(receipt.student.user.lastName || "")}
          </span>
          <span className="text-xs text-muted-foreground">
            {receipt.referenceNumber}
          </span>
        </div>
      )
    },
    {
      key: "class",
      label: "Class",
      mobilePriority: "low" as const,
      render: (receipt: PendingReceipt) => receipt.student.enrollments[0] ? (
        <div className="flex flex-col">
          <span>{receipt.student.enrollments[0].class.name}</span>
          <span className="text-xs text-muted-foreground">
            {receipt.student.enrollments[0].section.name}
          </span>
        </div>
      ) : "N/A",
    },
    {
      key: "amount",
      label: "Amount",
      render: (receipt: PendingReceipt) => <span className="font-semibold">₹{receipt.amount.toFixed(2)}</span>,
    },
    {
      key: "paymentDate",
      label: "Payment Date",
      mobilePriority: "low" as const,
      render: (receipt: PendingReceipt) => format(new Date(receipt.paymentDate), "MMM dd, yyyy"),
    },
    {
      key: "submitted",
      label: "Submitted",
      mobilePriority: "low" as const,
      render: (receipt: PendingReceipt) => format(new Date(receipt.createdAt), "MMM dd, yyyy"),
    },
    {
      key: "receipt",
      label: "Receipt",
      render: (receipt: PendingReceipt) => (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedImage(receipt.receiptImageUrl)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Receipt Image</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleDownloadReceipt(
                      receipt.receiptImageUrl,
                      receipt.referenceNumber
                    )
                  }
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
              <div className="relative w-full h-[600px] bg-muted rounded-lg overflow-hidden">
                <Image
                  src={receipt.receiptImageUrl}
                  alt={`Receipt ${receipt.referenceNumber}`}
                  fill
                  className="object-contain"
                  loading="lazy"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      isAction: true,
      render: (receipt: PendingReceipt) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => handleVerify(receipt.id)}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Verify
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleReject(receipt.id)}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Reject
          </Button>
        </div>
      ),
      mobileRender: (receipt: PendingReceipt) => (
        <div className="flex gap-2 w-full mt-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => handleVerify(receipt.id)}
            className="flex-1 bg-green-600 hover:bg-green-700 h-8 text-xs"
          >
            Verify
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleReject(receipt.id)}
            className="flex-1 h-8 text-xs"
          >
            Reject
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Verification</CardDescription>
            <CardTitle className="text-3xl text-amber-600">
              {isLoadingStats ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                stats?.pendingCount || 0
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Awaiting review
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Pending Amount</CardDescription>
            <CardTitle className="text-3xl text-primary">
              {isLoadingStats ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                `₹${((stats?.totalAmount || 0) / 1000).toFixed(1)}k`
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Unverified payments
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Verified</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {isLoadingStats ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                stats?.verifiedCount || 0
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Approved receipts
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rejected</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {isLoadingStats ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                stats?.rejectedCount || 0
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Declined receipts
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by student name or reference number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
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

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="grid gap-4 md:grid-cols-3 p-4 border rounded-lg bg-muted/50">
          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <select
              id="payment-method"
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
            >
              <option value="ALL">All Methods</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="ONLINE_PAYMENT">Online Payment</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="DEBIT_CARD">Debit Card</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount-min">Minimum Amount</Label>
            <Input
              id="amount-min"
              type="number"
              placeholder="Min amount"
              value={amountMinFilter}
              onChange={(e) => setAmountMinFilter(e.target.value)}
              min="0"
              step="100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount-max">Maximum Amount</Label>
            <Input
              id="amount-max"
              type="number"
              placeholder="Max amount"
              value={amountMaxFilter}
              onChange={(e) => setAmountMaxFilter(e.target.value)}
              min="0"
              step="100"
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {selectedReceipts.size > 0 && (
            <>
              <Button
                onClick={() => setShowBulkVerifyDialog(true)}
                className="bg-green-600 hover:bg-green-700"
                disabled={isBulkProcessing}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Verify Selected ({selectedReceipts.size})
              </Button>
              <Button
                onClick={() => setShowBulkRejectDialog(true)}
                variant="destructive"
                disabled={isBulkProcessing}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject Selected ({selectedReceipts.size})
              </Button>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            {showAdvancedFilters ? "Hide" : "Show"} Advanced Filters
          </Button>
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
              <>
                <Search className="mr-2 h-4 w-4" />
                Search
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!isLoading && receipts.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {searchQuery || startDate || endDate
              ? "No receipts found matching your filters."
              : "No pending receipts to verify. All receipts have been processed."}
          </AlertDescription>
        </Alert>
      )}

      {/* Results Table */}
      {receipts.length > 0 && (
        <>
          {/* Mobile Card View */}
          <ResponsiveTable
            data={receipts}
            columns={columns}
            keyExtractor={(item) => item.id}
          />

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * limit + 1} to{" "}
              {Math.min(currentPage * limit, receipts.length)} of {receipts.length} results
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
              <span className="text-sm">Page {currentPage}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={receipts.length < limit || isLoading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Bulk Verify Dialog */}
      <AlertDialog open={showBulkVerifyDialog} onOpenChange={setShowBulkVerifyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Verification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to verify {selectedReceipts.size} receipt(s)? This action will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Create payment records for all selected receipts</li>
                <li>Update student fee balances</li>
                <li>Send notifications to students</li>
                <li>Mark receipts as verified</li>
              </ul>
              <p className="mt-3 font-semibold">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkVerify}
              disabled={isBulkProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isBulkProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verify {selectedReceipts.size} Receipt(s)
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Reject Dialog */}
      <AlertDialog open={showBulkRejectDialog} onOpenChange={setShowBulkRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Rejection</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to reject {selectedReceipts.size} receipt(s). Please provide a reason:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="bulk-rejection-reason">Rejection Reason *</Label>
            <Textarea
              id="bulk-rejection-reason"
              placeholder="Enter reason for rejection (will be sent to all students)"
              value={bulkRejectionReason}
              onChange={(e) => setBulkRejectionReason(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkReject}
              disabled={isBulkProcessing || !bulkRejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isBulkProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject {selectedReceipts.size} Receipt(s)
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
