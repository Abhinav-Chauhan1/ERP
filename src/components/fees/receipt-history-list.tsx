"use client";

import { useState, useMemo } from "react";
import { ReceiptStatusCard } from "./receipt-status-card";
import { ReceiptDetailsDialog } from "./receipt-details-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReceiptStatus } from "@prisma/client";
import { FileText, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface Receipt {
  id: string;
  referenceNumber: string;
  status: ReceiptStatus;
  amount: number;
  paymentDate: Date;
  paymentMethod: any;
  transactionRef?: string | null;
  remarks?: string | null;
  receiptImageUrl: string;
  createdAt: Date;
  verifiedAt?: Date | null;
  verifiedBy?: string | null;
  rejectionReason?: string | null;
  student: {
    id: string;
    admissionId: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
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
    id: string;
    name: string;
    amount?: number | null;
    academicYear: {
      name: string;
    };
  };
  feePayment?: {
    id: string;
    status: string;
    paidAmount: number;
  } | null;
}

interface ReceiptHistoryListProps {
  receipts: Receipt[];
  showStudentName?: boolean;
  uploadUrl?: string; // Base URL for re-upload (will append query params)
}

const ITEMS_PER_PAGE = 10;

export function ReceiptHistoryList({
  receipts,
  showStudentName = false,
  uploadUrl,
}: ReceiptHistoryListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter receipts
  const filteredReceipts = useMemo(() => {
    let filtered = [...receipts];

    // Filter by status
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    // Filter by date range
    if (dateFromFilter) {
      const fromDate = new Date(dateFromFilter);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(
        (r) => new Date(r.createdAt) >= fromDate
      );
    }

    if (dateToFilter) {
      const toDate = new Date(dateToFilter);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (r) => new Date(r.createdAt) <= toDate
      );
    }

    return filtered;
  }, [receipts, statusFilter, dateFromFilter, dateToFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredReceipts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedReceipts = filteredReceipts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    handleFilterChange();
  };

  // Handle date filter change
  const handleDateFromChange = (value: string) => {
    setDateFromFilter(value);
    handleFilterChange();
  };

  const handleDateToChange = (value: string) => {
    setDateToFilter(value);
    handleFilterChange();
  };

  // Clear filters
  const handleClearFilters = () => {
    setStatusFilter("ALL");
    setDateFromFilter("");
    setDateToFilter("");
    setCurrentPage(1);
  };

  // Handle page change
  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // Check if filters are active
  const hasActiveFilters =
    statusFilter !== "ALL" || dateFromFilter !== "" || dateToFilter !== "";

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Status
                </label>
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value={ReceiptStatus.PENDING_VERIFICATION}>
                      Pending
                    </SelectItem>
                    <SelectItem value={ReceiptStatus.VERIFIED}>
                      Verified
                    </SelectItem>
                    <SelectItem value={ReceiptStatus.REJECTED}>
                      Rejected
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date From Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  From Date
                </label>
                <Input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => handleDateFromChange(e.target.value)}
                  max={dateToFilter || undefined}
                />
              </div>

              {/* Date To Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  To Date
                </label>
                <Input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => handleDateToChange(e.target.value)}
                  min={dateFromFilter || undefined}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {paginatedReceipts.length > 0 ? startIndex + 1 : 0} to{" "}
          {Math.min(endIndex, filteredReceipts.length)} of{" "}
          {filteredReceipts.length} receipt{filteredReceipts.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Receipt Cards */}
      {paginatedReceipts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paginatedReceipts.map((receipt) => (
            <ReceiptStatusCard
              key={receipt.id}
              receipt={receipt}
              onViewDetails={() => setSelectedReceipt(receipt)}
              showStudentName={showStudentName}
              uploadUrl={uploadUrl}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="rounded-full bg-gray-100 p-4">
                  <FileText className="h-12 w-12 text-gray-400" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  No receipts found
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {hasActiveFilters
                    ? "Try adjusting your filters to see more results"
                    : "You haven't uploaded any payment receipts yet"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Receipt Details Dialog */}
      {selectedReceipt && (
        <ReceiptDetailsDialog
          open={!!selectedReceipt}
          onOpenChange={(open) => !open && setSelectedReceipt(null)}
          receipt={selectedReceipt}
        />
      )}
    </div>
  );
}
