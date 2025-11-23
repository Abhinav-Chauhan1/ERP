"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/shared/pagination";
import { usePagination } from "@/hooks/use-pagination";
import { getExamsList } from "@/lib/actions/list-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar } from "lucide-react";

export default function ExamsListClient() {
  const { page, limit, setPage, setLimit } = usePagination();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const result = await getExamsList({
          page,
          limit,
        });
        setData(result);
      } catch (error) {
        console.error("Error fetching exams:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [page, limit]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Exams</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Exams</CardTitle>
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
              No exams found
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {data?.data.map((exam: any) => (
                  <div
                    key={exam.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{exam.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {exam.subject.name} • {exam.class.name}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(exam.examDate), "PPP")}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {exam.examType && (
                        <Badge variant="outline">{exam.examType.name}</Badge>
                      )}
                      {exam.term && (
                        <Badge variant="outline">{exam.term.name}</Badge>
                      )}
                      <Badge variant="outline">{exam.totalMarks} marks</Badge>
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
