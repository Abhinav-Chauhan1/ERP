"use client";


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/shared/pagination";
import { usePagination } from "@/hooks/use-pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { getAdmissionApplications, getAvailableClasses, getAdmissionStatistics } from "@/lib/actions/admissionActions";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter, Eye, Plus } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ConvertToStudentDialog } from "@/components/admin/admissions/convert-to-student-dialog";

export default function AdmissionsListPage() {
  const { page, limit, setPage, setLimit } = usePagination();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [classFilter, setClassFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // Load classes and statistics on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [classesData, stats] = await Promise.all([
          getAvailableClasses(),
          getAdmissionStatistics(),
        ]);
        setClasses(classesData);
        setStatistics(stats);
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    }
    loadInitialData();
  }, []);

  // Fetch applications
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const result = await getAdmissionApplications({
          page,
          limit,
          search: debouncedSearch,
          status: statusFilter,
          classId: classFilter === "all" ? "" : classFilter,
          startDate,
          endDate,
        });
        setData(result);
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [page, limit, debouncedSearch, statusFilter, classFilter, startDate, endDate]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "default";
      case "UNDER_REVIEW":
        return "secondary";
      case "ACCEPTED":
        return "default";
      case "REJECTED":
        return "destructive";
      case "WAITLISTED":
        return "outline";
      default:
        return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "text-blue-600 bg-blue-50";
      case "UNDER_REVIEW":
        return "text-yellow-600 bg-yellow-50";
      case "ACCEPTED":
        return "text-green-600 bg-green-50";
      case "REJECTED":
        return "text-red-600 bg-red-50";
      case "WAITLISTED":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const clearFilters = () => {
    setStatusFilter("ALL");
    setClassFilter("all");
    setStartDate(undefined);
    setEndDate(undefined);
    setSearch("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admission Applications</h1>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Submitted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{statistics.submitted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Under Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{statistics.underReview}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Accepted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.accepted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.rejected}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Waitlisted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{statistics.waitlisted}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Applications</CardTitle>
            <Link href="/admin/admissions/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Admission
              </Button>
            </Link>
          </div>
          <div className="mt-4 space-y-4">
            {/* Search */}
            <Input
              placeholder="Search by student name, parent name, or application number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="ACCEPTED">Accepted</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="WAITLISTED">Waitlisted</SelectItem>
                </SelectContent>
              </Select>

              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button variant="ghost" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
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
              No applications found
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {data?.data.map((application: any) => (
                  <div
                    key={application.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{application.studentName}</div>
                        <Badge variant="outline" className="text-xs">
                          {application.applicationNumber}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Parent: {application.parentName} • {application.parentEmail}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Applied for: {application.appliedClass.name} • Submitted: {format(new Date(application.submittedAt), "PPP")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("", getStatusColor(application.status))}>
                        {application.status.replace('_', ' ')}
                      </Badge>
                      {application.status === "ACCEPTED" && !application.studentId && (
                        <ConvertToStudentDialog
                          applicationId={application.id}
                          applicationNumber={application.applicationNumber}
                          studentName={application.studentName}
                          onSuccess={() => {
                            // Refresh the list
                            window.location.reload();
                          }}
                        />
                      )}
                      <Link href={`/admin/admissions/${application.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
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

