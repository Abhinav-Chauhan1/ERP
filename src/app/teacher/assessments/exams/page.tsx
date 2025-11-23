"use client";


import { useState, useEffect } from "react";
import Link from "next/link";
import { getTeacherExams } from "@/lib/actions/teacherExamsActions";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Filter,
  PlusCircle,
  Search,
  FileText,
  AlertCircle,
  CheckCircle,
  ClipboardList,
  Download,
  Edit,
  Copy,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

export default function TeacherExamsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      try {
        const data = await getTeacherExams(
          selectedSubject !== "all" ? selectedSubject : undefined
        );
        setExams(data.exams);
        setSubjects(data.subjects);
      } catch (error) {
        console.error("Failed to fetch exams:", error);
        toast.error("Failed to load exams");
      } finally {
        setLoading(false);
      }
    };
    
    fetchExams();
  }, [selectedSubject]);
  
  const filteredExams = exams
    .filter(exam => {
      if (activeTab === "all") return true;
      return exam.status === activeTab;
    })
    .filter(exam => 
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.grade.toLowerCase().includes(searchQuery.toLowerCase())
    );
  
  const upcomingExams = exams.filter(exam => exam.status === "upcoming");
  const completedExams = exams.filter(exam => exam.status === "completed");
  
  const onTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "upcoming":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Upcoming</Badge>;
      case "ongoing":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Ongoing</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Exams Management</h1>
        <Link href="/teacher/assessments/exams/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Exam
          </Button>
        </Link>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Upcoming Exams</CardTitle>
            <CardDescription>Scheduled examinations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{upcomingExams.length}</div>
            <div className="text-sm text-gray-500">
              Next exam: {upcomingExams.length > 0 ? format(new Date(upcomingExams[0].date), "MMM d, yyyy") : "None"}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pending Grades</CardTitle>
            <CardDescription>Exams needing evaluation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {exams.filter(e => e.status === "completed" && e.submittedBy > 0 && e.submittedBy !== e.totalStudents).length}
            </div>
            <div className="text-sm text-gray-500">Exams with ungraded submissions</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Completed Exams</CardTitle>
            <CardDescription>Past examinations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedExams.length}</div>
            <div className="text-sm text-gray-500">
              Average score: {completedExams.length > 0 
                ? `${(completedExams.reduce((sum, exam) => sum + parseFloat(exam.avgScore), 0) / completedExams.length).toFixed(1)}%`
                : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="all" onValueChange={onTabChange}>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <TabsList>
            <TabsTrigger value="all">All Exams</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search exams..."
                className="pl-9 w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select 
              value={selectedSubject} 
              onValueChange={setSelectedSubject}
            >
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-3.5 w-3.5" />
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="mt-6">
          <TabsContent value="all" className="m-0">
            <Card>
              <CardContent className="p-0">
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Title</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Class</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Type</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Date</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Time</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Marks</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                          <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredExams.length > 0 ? (
                          filteredExams.map((exam) => (
                            <tr key={exam.id} className="border-b">
                              <td className="py-3 px-4">
                                <div className="font-medium">{exam.title}</div>
                                <div className="text-xs text-gray-500">{exam.subject}</div>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {exam.grade}{exam.section !== "All" ? `-${exam.section}` : ""}
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant="outline">{exam.examType}</Badge>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {format(new Date(exam.date), "MMM d, yyyy")}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {exam.startTime} - {exam.endTime}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {exam.totalMarks}
                              </td>
                              <td className="py-3 px-4">
                                {getStatusBadge(exam.status)}
                              </td>
                              <td className="py-3 px-4 text-right space-x-1">
                                <Link href={`/teacher/assessments/exams/${exam.id}`}>
                                  <Button size="sm" variant="ghost">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Link href={`/teacher/assessments/exams/${exam.id}/edit`}>
                                  <Button size="sm" variant="ghost">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                                {exam.status === "upcoming" && (
                                  <Button size="sm" variant="ghost">
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                )}
                                {exam.status === "completed" && (
                                  <Button size="sm" variant="ghost">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="py-10 text-center text-gray-500">
                              <div className="flex flex-col items-center gap-1">
                                <AlertCircle className="h-8 w-8 text-gray-400" />
                                <p>No exams found</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Other tabs content will be similar */}
          
          <TabsContent value="upcoming" className="m-0">
            <div className="space-y-6">
              {upcomingExams.length > 0 ? (
                upcomingExams.map((exam) => (
                  <Card key={exam.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{exam.title}</CardTitle>
                          <CardDescription>{exam.subject} • {exam.grade}{exam.section !== "All" ? `-${exam.section}` : ""}</CardDescription>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Upcoming</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs text-gray-500">Date</div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-gray-500" />
                            <span>{format(new Date(exam.date), "MMM d, yyyy")}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Time</div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-gray-500" />
                            <span>{exam.startTime} - {exam.endTime}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Duration</div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-gray-500" />
                            <span>{exam.duration}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Total Marks</div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5 text-gray-500" />
                            <span>{exam.totalMarks}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm">
                        <FileText className="mr-1 h-4 w-4" /> Question Paper
                      </Button>
                      <div className="space-x-2">
                        <Link href={`/teacher/assessments/exams/${exam.id}/edit`}>
                          <Button size="sm" variant="outline">
                            <Edit className="mr-1 h-4 w-4" /> Edit
                          </Button>
                        </Link>
                        <Link href={`/teacher/assessments/exams/${exam.id}`}>
                          <Button size="sm">
                            <Eye className="mr-1 h-4 w-4" /> View Details
                          </Button>
                        </Link>
                      </div>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8">
                    <div className="flex flex-col items-center justify-center text-center">
                      <AlertCircle className="h-10 w-10 text-gray-400 mb-2" />
                      <h3 className="font-medium text-lg">No Upcoming Exams</h3>
                      <p className="text-gray-500 max-w-md mt-1">
                        There are no upcoming exams scheduled. Create a new exam to get started.
                      </p>
                      <div className="mt-4">
                        <Link href="/teacher/assessments/exams/create">
                          <Button>
                            <PlusCircle className="mr-2 h-4 w-4" /> Create Exam
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="completed" className="m-0">
            <div className="space-y-6">
              {completedExams.length > 0 ? (
                completedExams.map((exam) => (
                  <Card key={exam.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{exam.title}</CardTitle>
                          <CardDescription>{exam.subject} • {exam.grade}{exam.section !== "All" ? `-${exam.section}` : ""}</CardDescription>
                        </div>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-gray-500">Date</div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-gray-500" />
                            <span>{format(new Date(exam.date), "MMM d, yyyy")}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Time</div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-gray-500" />
                            <span>{exam.startTime} - {exam.endTime}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Submissions</div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            <span>{exam.submittedBy}/{exam.totalStudents}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Average Score</div>
                          <div className="flex items-center gap-1 font-medium">
                            <span>{exam.avgScore}</span>
                            <span className="text-xs text-gray-500">
                              out of {exam.totalMarks}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <h4 className="text-xs text-gray-500 mb-1">Performance Distribution</h4>
                        <div className="w-full flex h-2 rounded-full overflow-hidden">
                          <div className="bg-green-500 h-full" style={{ width: '40%' }}></div>
                          <div className="bg-blue-500 h-full" style={{ width: '30%' }}></div>
                          <div className="bg-amber-400 h-full" style={{ width: '20%' }}></div>
                          <div className="bg-red-500 h-full" style={{ width: '10%' }}></div>
                        </div>
                        <div className="flex justify-between text-xs mt-1 text-gray-500">
                          <span>A: 40%</span>
                          <span>B: 30%</span>
                          <span>C: 20%</span>
                          <span>F: 10%</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm">
                        <FileText className="mr-1 h-4 w-4" /> Answer Key
                      </Button>
                      <div className="space-x-2">
                        <Button size="sm" variant="outline">
                          <Download className="mr-1 h-4 w-4" /> Export Results
                        </Button>
                        <Link href={`/teacher/assessments/exams/${exam.id}`}>
                          <Button size="sm">
                            <ClipboardList className="mr-1 h-4 w-4" /> View Results
                          </Button>
                        </Link>
                      </div>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8">
                    <div className="flex flex-col items-center justify-center text-center">
                      <AlertCircle className="h-10 w-10 text-gray-400 mb-2" />
                      <h3 className="font-medium text-lg">No Completed Exams</h3>
                      <p className="text-gray-500 max-w-md mt-1">
                        There are no completed exams yet. Once exams are conducted, they will appear here.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

