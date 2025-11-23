"use client";


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/shared/pagination";
import { usePagination } from "@/hooks/use-pagination";
import { getAttendanceList } from "@/lib/actions/list-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { AttendanceStatus } from "@prisma/client";

const statusColors: Record<AttendanceStatus, string> = {
  PRESENT: "bg-green-500",
  ABSENT: "bg-red-500",
  LATE: "bg-yellow-500",
  HALF_DAY: "bg-orange-500",
  LEAVE: "bg-blue-500",
};

const statusLabels: Record<AttendanceStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  HALF_DAY: "Half Day",
  LEAVE: "Leave",
};

export default function AttendanceListPage() {
  const { page, limit, setPage, setLimit } = usePagination();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const result = await getAttendanceList({
          page,
          limit,
        });
        setData(result);
      } catch (error) {
        console.error("Error fetching attendance:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [page, limit]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Attendance Records</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Attendance Records</CardTitle>
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
              No attendance records found
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {data?.data.map((record: any) => (
                  <div
                    key={record.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {record.student.user.firstName} {record.student.user.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {record.section.class.name} - {record.section.name}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {format(new Date(record.date), "PPP")}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${statusColors[record.status as AttendanceStatus]} text-white`}
                    >
                      {statusLabels[record.status as AttendanceStatus]}
                    </Badge>
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

