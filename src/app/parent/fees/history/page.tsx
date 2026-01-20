"use client";


import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PaymentHistoryTable } from "@/components/parent/fees/payment-history-table";
import { getPaymentHistory, downloadReceipt } from "@/lib/actions/parent-fee-actions";
import { Button } from "@/components/ui/button";
import { Calendar, Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";

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

interface Child {
  id: string;
  name: string;
  class: string;
}

export default function PaymentHistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const childId = searchParams.get("childId");

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    status: "",
    paymentMethod: "",
    search: ""
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchChildren = useCallback(async () => {
    try {
      const response = await fetch("/api/parent/children");
      if (response.ok) {
        const data = await response.json();

        // Map API response to expected format
        const mappedChildren = (data.children || []).map((child: any) => ({
          id: child.id,
          name: `${child.user.firstName} ${child.user.lastName}`,
          class: child.enrollments?.[0]?.class?.name || "N/A",
        }));

        setChildren(mappedChildren);

        // Set selected child
        if (childId && mappedChildren.find((c: Child) => c.id === childId)) {
          setSelectedChildId(childId);
        } else if (mappedChildren.length > 0) {
          setSelectedChildId(mappedChildren[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching children:", error);
      toast.error("Failed to load children");
    }
  }, [childId]);

  const fetchPaymentHistory = useCallback(async () => {
    if (!selectedChildId) return;

    setIsLoading(true);
    try {
      const result = await getPaymentHistory({
        childId: selectedChildId,
        page: pagination.page,
        limit: pagination.limit,
        status: filters.status ? filters.status as any : undefined,
        paymentMethod: filters.paymentMethod ? filters.paymentMethod as any : undefined,
      });

      if (result.success && result.data) {
        setPayments(result.data.payments);
        setPagination(result.data.pagination);
      } else {
        toast.error(result.message || "Failed to load payment history");
      }
    } catch (error) {
      console.error("Error fetching payment history:", error);
      toast.error("Failed to load payment history");
    } finally {
      setIsLoading(false);
    }
  }, [selectedChildId, pagination.page, pagination.limit, filters.status, filters.paymentMethod]);

  // Fetch children on mount
  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  // Fetch payment history when child or filters change
  useEffect(() => {
    if (selectedChildId) {
      fetchPaymentHistory();
    }
  }, [selectedChildId, fetchPaymentHistory]);

  const handleChildChange = (newChildId: string) => {
    setSelectedChildId(newChildId);
    router.push(`/parent/fees/history?childId=${newChildId}`);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (newFilters: {
    status?: string;
    paymentMethod?: string;
    search?: string;
  }) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDownloadReceipt = async (paymentId: string) => {
    if (!selectedChildId) return;

    try {
      const result = await downloadReceipt({
        paymentId,
        childId: selectedChildId
      });

      if (result.success && result.data?.html) {
        // Open a new window with the receipt HTML for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(result.data.html);
          printWindow.document.close();
          // Trigger print dialog after a short delay to ensure content is loaded
          setTimeout(() => {
            printWindow.print();
          }, 500);
        } else {
          toast.error("Please allow popups to download receipt");
        }
        toast.success("Receipt generated successfully");
      } else {
        toast.error(result.message || "Failed to download receipt");
      }
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast.error("Failed to download receipt");
    }
  };

  if (isLoading && payments.length === 0) {
    return (
      <div className="h-full p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-64" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Payment History</h1>
          <p className="text-gray-600 mt-1">View all past payments and receipts</p>
        </div>

        {/* Child Selector */}
        {children.length > 1 && (
          <Select value={selectedChildId} onValueChange={handleChildChange}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.name} - {child.class}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Payment History Table */}
      <PaymentHistoryTable
        payments={payments}
        pagination={pagination}
        onPageChange={handlePageChange}
        onDownloadReceipt={handleDownloadReceipt}
        onFilterChange={handleFilterChange}
      />
    </div>
  );
}

