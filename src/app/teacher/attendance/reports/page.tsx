"use client";


import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Search,
  Download,
  Filter,
  ArrowLeft,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Clock,
  UserX,
  FileText,
  Calendar as CalendarIcon,
  Loader2,
  BarChart,
  FileBarChart2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Chart } from "@/components/dashboard/chart";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { format, subDays } from "date-fns";
import { getTeacherAttendanceReports } from "@/lib/actions/teacherAttendanceActions";
import { toast } from "react-hot-toast";
import { AttendanceStatus } from "@prisma/client";

function AttendanceReportsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classIdParam = searchParams.get('classId');
  const sectionIdParam = searchParams.get('sectionId');

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filters
  const [classId, setClassId] = useState<string | null>(classIdParam);
  const [sectionId, setSectionId] = useState<string | null>(sectionIdParam);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState("overview");

  const fetchAttendanceReports = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = {
        classId: classId || undefined,
        sectionId: sectionId || undefined,
        startDate: dateRange?.from?.toISOString(),
        endDate: dateRange?.to?.toISOString(),
        status: statusFilter || undefined,
      };

      const data = await getTeacherAttendanceReports(filters);
      setReportData(data);
    } catch (error) {
      console.error("Failed to fetch attendance reports:", error);
      toast.error("Failed to load attendance reports data");
    } finally {
      setLoading(false);
    }
  }, [classId, sectionId, dateRange, statusFilter]);

  // Load initial data
  useEffect(() => {
    fetchAttendanceReports();
  }, [fetchAttendanceReports]);

  const handleClassChange = (value: string) => {
    setClassId(value === "all" ? null : value);
    setSectionId(null); // Reset section when class changes

    // Update URL
    const params = new URLSearchParams();
    if (value !== "all") params.set("classId", value);
    router.push(`/teacher/attendance/reports?${params.toString()}`);
  };

  const handleSectionChange = (value: string) => {
    setSectionId(value === "all" ? null : value);

    // Update URL
    const params = new URLSearchParams();
    if (classId) params.set("classId", classId);
    if (value !== "all") params.set("sectionId", value);
    router.push(`/teacher/attendance/reports?${params.toString()}`);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === "all" ? null : value as AttendanceStatus);
    fetchAttendanceReports();
  };

  const formatDateRange = () => {
    if (!dateRange?.from) return "Select a date range";
    return `${format(dateRange.from, "MMM d, yyyy")} - ${dateRange.to ? format(dateRange.to, "MMM d, yyyy") : ""}`;
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case "PRESENT":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Present</Badge>;
      case "ABSENT":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Absent</Badge>;
      case "LATE":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Late</Badge>;
      case "LEAVE":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Leave</Badge>;
      case "HALF_DAY":
        return <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100">Half Day</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Filter recent attendance records by search query
  const filteredRecords = reportData?.recentAttendance.filter((record: any) =>
    record.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (loading && !reportData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => router.push('/teacher/attendance')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance Reports</h1>
          <p className="text-gray-500">Analyze attendance patterns and trends</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-3">
          <DateRangePicker
            value={dateRange}
            onValueChange={setDateRange}
          />

          <Select
            value={classId || "all"}
            onValueChange={handleClassChange}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {reportData?.classes.map((cls: any) => (
                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {classId && (
            <Select
              value={sectionId || "all"}
              onValueChange={handleSectionChange}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select Section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {reportData?.classes
                  .find((cls: any) => cls.id === classId)?.sections
                  .map((section: any) => (
                    <SelectItem key={section.id} value={section.id}>{section.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
          <Button>
            <FileBarChart2 className="mr-2 h-4 w-4" /> Generate Report
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="class-wise">Class-wise</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="records">Attendance Records</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total Records</CardTitle>
                <CardDescription>All attendance entries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reportData?.stats.total || 0}</div>
                <div className="text-sm text-gray-500">
                  {formatDateRange()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Present</CardTitle>
                <CardDescription>Present students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {reportData?.stats.PRESENT || 0}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  <span>
                    {Math.round((reportData?.stats.PRESENT / reportData?.stats.total) * 100) || 0}% of total
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Absent</CardTitle>
                <CardDescription>Absent students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {reportData?.stats.ABSENT || 0}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                  <span>
                    {Math.round((reportData?.stats.ABSENT / reportData?.stats.total) * 100) || 0}% of total
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Late</CardTitle>
                <CardDescription>Late arrivals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">
                  {reportData?.stats.LATE || 0}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  <span>
                    {Math.round((reportData?.stats.LATE / reportData?.stats.total) * 100) || 0}% of total
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daily Attendance Trends</CardTitle>
              <CardDescription>Attendance patterns over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <Chart
                  title="Daily Attendance"
                  data={reportData?.dailyTrends || []}
                  type="area"
                  xKey="date"
                  yKey="PRESENT"
                  categories={["PRESENT", "ABSENT", "LATE"]}
                  colors={["#10b981", "#ef4444", "#f59e0b"]}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Distribution</CardTitle>
                <CardDescription>Breakdown by attendance status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[240px]">
                  <Chart
                    title="Attendance Distribution"
                    data={[
                      { status: "Present", value: reportData?.stats.PRESENT || 0 },
                      { status: "Absent", value: reportData?.stats.ABSENT || 0 },
                      { status: "Late", value: reportData?.stats.LATE || 0 },
                      { status: "Leave", value: reportData?.stats.LEAVE || 0 },
                      { status: "Half Day", value: reportData?.stats.HALF_DAY || 0 },
                    ]}
                    type="pie"
                    xKey="status"
                    yKey="value"
                    categories={["value"]}
                    colors={["#10b981", "#ef4444", "#f59e0b", "#3b82f6", "#14b8a6"]}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Students with Low Attendance</CardTitle>
                    <CardDescription>Students who need attention</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" /> Export List
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden max-h-[240px] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData?.studentsWithLowAttendance.map((student: any) => (
                        <tr key={student.studentId}>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium">{student.studentName}</div>
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-center text-sm">
                            {student.className}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-center">
                            <div className="text-sm text-green-600 font-medium">{student.presentCount}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-center">
                            <div className="text-sm text-red-600 font-medium">{student.absentCount}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-right text-sm">
                            <Link href={`/teacher/students/${student.studentId}/attendance`}>
                              <Button variant="link" className="h-auto p-0">View</Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="class-wise" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reportData?.classWiseStats.map((classStats: any) => (
              <Card key={classStats.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{classStats.name}</CardTitle>
                  <CardDescription>Attendance statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500">Present</p>
                      <p className="text-lg font-bold text-green-600">{classStats.PRESENT}</p>
                      <p className="text-xs text-gray-500">{classStats.presentPercentage}%</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500">Absent</p>
                      <p className="text-lg font-bold text-red-600">{classStats.ABSENT}</p>
                      <p className="text-xs text-gray-500">{classStats.absentPercentage}%</p>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${classStats.presentPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Total records: {classStats.total}</span>
                    <span>Attendance: {classStats.presentPercentage}%</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Link href={`/teacher/attendance/reports?classId=${classStats.id}`} className="w-full">
                    <Button variant="outline" className="w-full">
                      View Detailed Report
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Student-wise Attendance</CardTitle>
                  <CardDescription>Individual student attendance records</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative w-[250px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Search students..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select
                    value={statusFilter || "all"}
                    onValueChange={handleStatusFilterChange}
                  >
                    <SelectTrigger className="w-[170px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="PRESENT">Present</SelectItem>
                      <SelectItem value="ABSENT">Absent</SelectItem>
                      <SelectItem value="LATE">Late</SelectItem>
                      <SelectItem value="LEAVE">Leave</SelectItem>
                      <SelectItem value="HALF_DAY">Half Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden max-h-[500px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Late</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">% Present</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData?.studentsWithLowAttendance.map((student: any) => (
                      <tr key={student.studentId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="font-medium">{student.studentName}</div>
                              <div className="text-xs text-gray-500">#{student.rollNumber}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {student.className}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm font-medium text-green-600">{student.presentCount}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm font-medium text-red-600">{student.absentCount}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm font-medium text-amber-600">{student.lateCount}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                              <div
                                className={`h-1.5 rounded-full ${(student.presentCount / student.totalRecords) * 100 >= 75 ? 'bg-green-500' :
                                    (student.presentCount / student.totalRecords) * 100 >= 50 ? 'bg-amber-500' :
                                      'bg-red-500'
                                  }`}
                                style={{ width: `${(student.presentCount / student.totalRecords) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">
                              {Math.round((student.presentCount / student.totalRecords) * 100)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <Link href={`/teacher/students/${student.studentId}/attendance`}>
                            <Button variant="outline" size="sm">View Report</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Recent Attendance Records</CardTitle>
                  <CardDescription>Log of individual attendance entries</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative w-[250px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Search records..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Export Records
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((record: any) => (
                        <tr key={record.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="font-medium">{record.studentName}</div>
                                <div className="text-xs text-gray-500">#{record.rollNumber}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {record.className} {record.sectionName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {format(new Date(record.date), "MMMM d, yyyy")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {getStatusBadge(record.status as AttendanceStatus)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {record.reason || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <Link href={`/teacher/students/${record.studentId}/attendance`}>
                              <Button variant="link" className="h-auto p-0">View Student</Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          No attendance records found matching your search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


export default function AttendanceReportsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <AttendanceReportsContent />
    </Suspense>
  );
}

