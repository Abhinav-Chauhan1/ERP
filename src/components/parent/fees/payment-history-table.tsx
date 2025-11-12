"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  ArrowUpDown,
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDebounce } from "@/hooks/use-debounce";

interface PaymentRecord {
  id: string;
  amount: number;
  paidAmount: number;
  balance: number;
  paymentDate: Date;
  paymentMethod: string;
  transactionId: string | null;
  receiptNumber: string | null;
  status: "PENDING" | "COMPLETED" | "PARTIAL" | "FAILED" | "REFUNDED";
  remarks: string | null;
  feeStructureName: string;
  academicYear: string;
}

interface PaymentHistoryTableProps {
  payments: PaymentRecord[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onDownloadReceipt: (paymentId: string) => void;
  onFilterChange?: (filters: {
    status?: string;
    paymentMethod?: string;
    search?: string;
  }) => void;
}

type SortField = "paymentDate" | "amount" | "status";
type SortOrder = "asc" | "desc";

export function PaymentHistoryTable({
  payments,
  pagination,
  onPageChange,
  onDownloadReceipt,
  onFilterChange,
}: PaymentHistoryTableProps) {
  const [sortField, setSortField] = useState<SortField>("paymentDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [methodFilter, setMethodFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Debounce search query with 300ms delay
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleFilterChange = (type: "status" | "method", value: string) => {
    if (type === "status") {
      setStatusFilter(value);
    } else {
      setMethodFilter(value);
    }
    
    if (onFilterChange) {
      onFilterChange({
        status: type === "status" ? value : statusFilter,
        paymentMethod: type === "method" ? value : methodFilter,
        search: debouncedSearchQuery,
      });
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };
  
  // Trigger filter change when debounced search changes
  if (onFilterChange && debouncedSearchQuery !== searchQuery) {
    onFilterChange({
      status: statusFilter,
      paymentMethod: methodFilter,
      search: debouncedSearchQuery,
    });
  }

  const sortedPayments = [...payments].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case "paymentDate":
        comparison = new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime();
        break;
      case "amount":
        comparison = a.amount - b.amount;
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
    }
    
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const getStatusBadge = (status: PaymentRecord["status"]) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "PARTIAL":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Partial</Badge>;
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>;
      case "REFUNDED":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatPaymentMethod = (method: string) => {
    return method
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="text-lg">Payment History</CardTitle>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by receipt or transaction ID..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(value) => handleFilterChange("status", value)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={methodFilter} onValueChange={(value) => handleFilterChange("method", value)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CHEQUE">Cheque</SelectItem>
                <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="ONLINE_PAYMENT">Online Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("paymentDate")}
                    className="h-8 px-2"
                  >
                    Date
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("amount")}
                    className="h-8 px-2"
                  >
                    Amount
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Method</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("status")}
                    className="h-8 px-2"
                  >
                    Status
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No payment records found
                  </TableCell>
                </TableRow>
              ) : (
                sortedPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.receiptNumber || "N/A"}
                    </TableCell>
                    <TableCell>
                      {format(new Date(payment.paymentDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${payment.paidAmount.toFixed(2)}
                      {payment.balance > 0 && (
                        <span className="text-xs text-gray-500 block">
                          Balance: ${payment.balance.toFixed(2)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatPaymentMethod(payment.paymentMethod)}
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {payment.transactionId || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownloadReceipt(payment.id)}
                        disabled={payment.status !== "COMPLETED"}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{" "}
              {pagination.totalCount} payments
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
