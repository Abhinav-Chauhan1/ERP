"use client";


import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { OptimizedImage } from "@/components/shared/optimized-image";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  BarChart,
  BookOpen,
  Calendar,
  CheckCircle,
  Download,
  Eye,
  FileText,
  Filter,
  Loader2,
  MailIcon,
  PhoneIcon,
  PieChart,
  Search,
  SortAsc,
  SortDesc,
  UserCircle,
  Users,
  XCircle
} from "lucide-react";
import { getTeacherStudents } from "@/lib/actions/teacherStudentsActions";
import { toast } from "react-hot-toast";

// Define interfaces for data types
interface Section {
  id: string;
  name: string;
}

function TeacherStudentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get filter params from URL
  const searchQuery = searchParams.get("search") || "";
  const classId = searchParams.get("classId") || "all";  // Changed default from "" to "all"
  const sectionId = searchParams.get("sectionId") || "all";  // Changed default from "" to "all"
  const sortBy = searchParams.get("sortBy") || "name";
  const sortOrder = searchParams.get("sortOrder") || "asc";
  
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Define performance tiers for filtering
  const performanceTiers = {
    all: { label: "All Students", min: 0, max: 100 },
    excellent: { label: "Excellent (90%+)", min: 90, max: 100 },
    good: { label: "Good (75-89%)", min: 75, max: 89 },
    average: { label: "Average (60-74%)", min: 60, max: 74 },
    belowAverage: { label: "Below Average (< 60%)", min: 0, max: 59 },
  };
  
  // Fetch students on mount and when filters change
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const result = await getTeacherStudents({
          search: searchQuery,
          classId: classId !== "all" ? classId : undefined,  // Changed to check for "all"
          sectionId: sectionId !== "all" ? sectionId : undefined,  // Changed to check for "all"
          sortBy,
          sortOrder: sortOrder as "asc" | "desc",
        });
        
        setStudents(result.students);
        setClasses(result.classes);
      } catch (error) {
        console.error("Failed to fetch students:", error);
        toast.error("Failed to load students");
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudents();
  }, [searchQuery, classId, sectionId, sortBy, sortOrder]);
  
  // Update URL with filters
  const updateFilters = (filters: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    router.push(`/teacher/students?${params.toString()}`);
  };
  
  // Handle search
  const handleSearch = () => {
    updateFilters({ search: searchInput });
  };
  
  // Filter students by performance tier
  const filteredStudents = students.filter(student => {
    if (activeTab === "all") return true;
    
    const tier = performanceTiers[activeTab as keyof typeof performanceTiers];
    return student.metrics.overallPerformance >= tier.min && 
           student.metrics.overallPerformance <= tier.max;
  });
  
  // Handle sorting
  const handleSort = (column: string) => {
    let order = "asc";
    if (sortBy === column && sortOrder === "asc") {
      order = "desc";
    }
    
    updateFilters({ sortBy: column, sortOrder: order });
  };
  
  // Calculate class statistics
  const calculateClassStats = () => {
    if (students.length === 0) return null;
    
    const totalStudents = students.length;
    const avgAttendance = Math.round(
      students.reduce((sum, student) => sum + student.metrics.attendancePercentage, 0) / totalStudents
    );
    const avgPerformance = Math.round(
      students.reduce((sum, student) => sum + student.metrics.overallPerformance, 0) / totalStudents
    );
    
    const performanceTierCounts = {
      excellent: students.filter(s => s.metrics.overallPerformance >= 90).length,
      good: students.filter(s => s.metrics.overallPerformance >= 75 && s.metrics.overallPerformance < 90).length,
      average: students.filter(s => s.metrics.overallPerformance >= 60 && s.metrics.overallPerformance < 75).length,
      belowAverage: students.filter(s => s.metrics.overallPerformance < 60).length,
    };
    
    return {
      totalStudents,
      avgAttendance,
      avgPerformance,
      performanceTierCounts
    };
  };
  
  const classStats = calculateClassStats();
  
  // Get the currently selected class name
  const selectedClassName = classId !== "all" 
    ? classes.find(cls => cls.id === classId)?.name 
    : "All Classes";
  
  // Get sections for the selected class
  const sectionsForClass = classId !== "all" 
    ? classes.find(cls => cls.id === classId)?.sections || []
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Student List</h1>
          <p className="text-muted-foreground">
            {classStats?.totalStudents || 0} students in {selectedClassName}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search students..."
              className="w-[250px] pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          
          <Select
            value={classId}
            onValueChange={(value) => updateFilters({ classId: value, sectionId: "all" })}
          >
            <SelectTrigger className="w-[170px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {classId !== "all" && sectionsForClass.length > 0 && (
            <Select
              value={sectionId}
              onValueChange={(value) => updateFilters({ sectionId: value })}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sectionsForClass.map((section: Section) => (
                  <SelectItem key={section.id} value={section.id}>{section.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Button
            variant="outline"
            onClick={() => {
              // Implementation would need actual export functionality
              toast.success("Student list exported successfully");
            }}
          >
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>
      
      {classStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Total Students</CardTitle>
              <CardDescription>Number of students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{classStats.totalStudents}</div>
              <div className="text-sm text-gray-500 flex items-center mt-1">
                <Users className="h-4 w-4 mr-1" />
                <span>
                  {classId 
                    ? `In ${selectedClassName}` 
                    : "Across all your classes"}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Average Attendance</CardTitle>
              <CardDescription>Overall attendance rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{classStats.avgAttendance}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${
                    classStats.avgAttendance >= 90 ? 'bg-green-500' :
                    classStats.avgAttendance >= 80 ? 'bg-emerald-500' :
                    classStats.avgAttendance >= 70 ? 'bg-amber-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${classStats.avgAttendance}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Average Performance</CardTitle>
              <CardDescription>Overall academic results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{classStats.avgPerformance}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${
                    classStats.avgPerformance >= 90 ? 'bg-green-500' :
                    classStats.avgPerformance >= 75 ? 'bg-emerald-500' :
                    classStats.avgPerformance >= 60 ? 'bg-amber-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${classStats.avgPerformance}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Performance Distribution</CardTitle>
              <CardDescription>Student performance levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full flex h-2 rounded-full overflow-hidden mb-3">
                <div className="bg-green-500 h-full" style={{ width: `${(classStats.performanceTierCounts.excellent / classStats.totalStudents) * 100}%` }}></div>
                <div className="bg-blue-500 h-full" style={{ width: `${(classStats.performanceTierCounts.good / classStats.totalStudents) * 100}%` }}></div>
                <div className="bg-amber-500 h-full" style={{ width: `${(classStats.performanceTierCounts.average / classStats.totalStudents) * 100}%` }}></div>
                <div className="bg-red-500 h-full" style={{ width: `${(classStats.performanceTierCounts.belowAverage / classStats.totalStudents) * 100}%` }}></div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-center">
                <div>
                  <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                    {classStats.performanceTierCounts.excellent} Excellent
                  </span>
                </div>
                <div>
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    {classStats.performanceTierCounts.good} Good
                  </span>
                </div>
                <div>
                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    {classStats.performanceTierCounts.average} Average
                  </span>
                </div>
                <div>
                  <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                    {classStats.performanceTierCounts.belowAverage} Below Avg
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all">All Students</TabsTrigger>
            <TabsTrigger value="excellent">Excellent</TabsTrigger>
            <TabsTrigger value="good">Good</TabsTrigger>
            <TabsTrigger value="average">Average</TabsTrigger>
            <TabsTrigger value="belowAverage">Below Average</TabsTrigger>
          </TabsList>
          
          <div className="text-sm text-gray-500">
            Showing {filteredStudents.length} of {students.length} students
          </div>
        </div>
        
        <div className="mt-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredStudents.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center"
                        onClick={() => handleSort("name")}
                      >
                        Student
                        {sortBy === "name" && (
                          sortOrder === "asc" ? 
                            <SortAsc className="ml-1 h-3 w-3" /> : 
                            <SortDesc className="ml-1 h-3 w-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center justify-center mx-auto"
                        onClick={() => handleSort("metrics.attendancePercentage")}
                      >
                        Attendance
                        {sortBy === "metrics.attendancePercentage" && (
                          sortOrder === "asc" ? 
                            <SortAsc className="ml-1 h-3 w-3" /> : 
                            <SortDesc className="ml-1 h-3 w-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center justify-center mx-auto"
                        onClick={() => handleSort("metrics.examPerformance")}
                      >
                        Exams
                        {sortBy === "metrics.examPerformance" && (
                          sortOrder === "asc" ? 
                            <SortAsc className="ml-1 h-3 w-3" /> : 
                            <SortDesc className="ml-1 h-3 w-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center justify-center mx-auto"
                        onClick={() => handleSort("metrics.assignmentCompletionRate")}
                      >
                        Assignments
                        {sortBy === "metrics.assignmentCompletionRate" && (
                          sortOrder === "asc" ? 
                            <SortAsc className="ml-1 h-3 w-3" /> : 
                            <SortDesc className="ml-1 h-3 w-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center justify-center mx-auto"
                        onClick={() => handleSort("metrics.overallPerformance")}
                      >
                        Overall
                        {sortBy === "metrics.overallPerformance" && (
                          sortOrder === "asc" ? 
                            <SortAsc className="ml-1 h-3 w-3" /> : 
                            <SortDesc className="ml-1 h-3 w-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {student.avatar ? (
                              <OptimizedImage 
                                src={student.avatar} 
                                alt={student.name} 
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-full"
                                qualityPreset="medium"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                <UserCircle className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-gray-500">
                              {student.rollNumber ? `#${student.rollNumber}` : student.admissionId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium">{student.className}</div>
                          <div className="text-sm text-gray-500">{student.section}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          <div 
                            className={`h-2.5 w-2.5 rounded-full mr-2 ${
                              student.metrics.attendancePercentage >= 90 ? 'bg-green-500' :
                              student.metrics.attendancePercentage >= 80 ? 'bg-emerald-500' :
                              student.metrics.attendancePercentage >= 70 ? 'bg-amber-500' :
                              'bg-red-500'
                            }`}
                          ></div>
                          <span className="text-sm font-medium">
                            {student.metrics.attendancePercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span 
                          className={`px-2 py-1 text-xs rounded-full font-medium ${
                            student.metrics.examPerformance >= 90 ? 'bg-green-100 text-green-800' :
                            student.metrics.examPerformance >= 75 ? 'bg-blue-100 text-blue-800' :
                            student.metrics.examPerformance >= 60 ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          {student.metrics.examPerformance}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          <div 
                            className={`h-2.5 w-2.5 rounded-full mr-2 ${
                              student.metrics.assignmentCompletionRate >= 90 ? 'bg-green-500' :
                              student.metrics.assignmentCompletionRate >= 75 ? 'bg-emerald-500' :
                              student.metrics.assignmentCompletionRate >= 60 ? 'bg-amber-500' :
                              'bg-red-500'
                            }`}
                          ></div>
                          <span className="text-sm font-medium">
                            {student.metrics.assignmentCompletionRate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span 
                          className={`px-3 py-1 text-xs rounded-full font-medium ${
                            student.metrics.overallPerformance >= 90 ? 'bg-green-100 text-green-800' :
                            student.metrics.overallPerformance >= 75 ? 'bg-blue-100 text-blue-800' :
                            student.metrics.overallPerformance >= 60 ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          {student.metrics.overallPerformance}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <Link href={`/teacher/students/${student.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 border rounded-md">
              <div className="flex flex-col items-center gap-2">
                <Users className="h-12 w-12 text-gray-300" />
                <h3 className="text-lg font-medium mt-2">No Students Found</h3>
                <p className="text-gray-500 max-w-sm">
                  {searchQuery ? 
                    "No students match your search criteria. Try adjusting your search or filters." : 
                    "There are no students to display in the selected class or view."}
                </p>
              </div>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}


export default function TeacherStudentsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <TeacherStudentsContent />
    </Suspense>
  );
}

