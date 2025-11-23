"use client";


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/shared/pagination";
import { usePagination } from "@/hooks/use-pagination";
import { getFeePaymentsList } from "@/lib/actions/list-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  PAID: "bg-green-500",
  PENDING: "bg-yellow-500",
  OVERDUE: "bg-red-500",
  PARTIAL: "bg-blue-500",
};

export default function FeePaymentsListPage() {
  const { page, limit, setPage, setLimit } = usePagination();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const result = await getFeePaymentsList({
          page,
          limit,
        });
        setData(result);
      } catch (error) {
        console.error("Error fetching fee payments:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [page, limit]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Fee Payments</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Fee Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No fee payments found
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {data?.data.map((payment: any) => (
                  <div
                    key={payment.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {payment.student.user.firstName} {payment.student.user.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {payment.feeStructure.name}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {format(new Date(payment.paymentDate), "PPP")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        ₹{payment.amount.toLocaleString()}
                      </div>
                      <Badge
                        variant="outline"
                        className={`${statusColors[payment.status] || 'bg-gray-500'} text-white mt-1`}
                      >
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {data && (
                <Pagination
                  currentPage={data.pagination.page}
                  totalPages={data.pagination.totalPages}
                  totalItems={data.pagination.total}
                  itemsPerPage={data.pagination.limit}
                  onPageChange={setPage}
                  onItemsPerPageChange={setLimit}
                  showItemsPerPage
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

