"use client";


import { useState, useEffect } from "react";
import Link from "next/link";
import { getTeacherAssignments } from "@/lib/actions/teacherAssignmentsActions";
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
  Trash2,
  Eye,
  BarChart4,
  File,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

export default function TeacherAssignmentsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [assignments, setAssignments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      try {
        const data = await getTeacherAssignments(
          selectedSubject !== "all" ? selectedSubject : undefined
        );
        setAssignments(data.assignments);
        setSubjects(data.subjects);
      } catch (error) {
        console.error("Failed to fetch assignments:", error);
        toast.error("Failed to load assignments");
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssignments();
  }, [selectedSubject]);
  
  const filteredAssignments = assignments
    .filter(assignment => {
      if (activeTab === "all") return true;
      return assignment.status === activeTab;
    })
    .filter(assignment => 
      assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.classes.some((cls: any) => cls.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  
  const pendingGradingCount = assignments.filter(a => a.pendingCount > 0).length;
  const activeAssignments = assignments.filter(a => a.status === "active");
  const completedAssignments = assignments.filter(a => a.status === "completed");
  
  const onTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Completed</Badge>;
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
        <h1 className="text-2xl font-bold tracking-tight">Assignments</h1>
        <Link href="/teacher/assessments/assignments/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Assignment
          </Button>
        </Link>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Active Assignments</CardTitle>
            <CardDescription>Ongoing assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeAssignments.length}</div>
            <div className="text-sm text-gray-500">
              {activeAssignments.length > 0 
                ? `Next due: ${format(new Date(activeAssignments[0].dueDate), "MMM d, yyyy")}`
                : "No active assignments"}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pending Grading</CardTitle>
            <CardDescription>Submissions to review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingGradingCount}</div>
            <div className="text-sm text-gray-500">Assignments with ungraded submissions</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Completed</CardTitle>
            <CardDescription>Past assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedAssignments.length}</div>
            <div className="text-sm text-gray-500">Finalized assignments</div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="all" onValueChange={onTabChange}>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <TabsList>
            <TabsTrigger value="all">All Assignments</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search assignments..."
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
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Due Date</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Submissions</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                          <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAssignments.length > 0 ? (
                          filteredAssignments.map((assignment) => (
                            <tr key={assignment.id} className="border-b">
                              <td className="py-3 px-4">
                                <div className="font-medium">{assignment.title}</div>
                                <div className="text-xs text-gray-500">{assignment.subject}</div>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {assignment.classes.map((cls: any) => cls.name).join(", ")}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {format(new Date(assignment.dueDate), "MMM d, yyyy")}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  <span>{assignment.submittedCount}</span>
                                  {assignment.pendingCount > 0 && (
                                    <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 hover:bg-amber-50">
                                      {assignment.pendingCount} to grade
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                {getStatusBadge(assignment.status)}
                              </td>
                              <td className="py-3 px-4 text-right space-x-1">
                                <Link href={`/teacher/assessments/assignments/${assignment.id}`}>
                                  <Button size="sm" variant="ghost">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Link href={`/teacher/assessments/assignments/${assignment.id}/edit`}>
                                  <Button size="sm" variant="ghost">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button size="sm" variant="ghost">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-10 text-center text-gray-500">
                              <div className="flex flex-col items-center gap-1">
                                <AlertCircle className="h-8 w-8 text-gray-400" />
                                <p>No assignments found</p>
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
          
          <TabsContent value="active" className="m-0">
            <div className="space-y-6">
              {activeAssignments.length > 0 ? (
                activeAssignments.map((assignment) => (
                  <Card key={assignment.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{assignment.title}</CardTitle>
                          <CardDescription>
                            {assignment.subject} • {assignment.classes.map((cls: any) => cls.name).join(", ")}
                          </CardDescription>
                        </div>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-gray-500">Due Date</div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-gray-500" />
                            <span>{format(new Date(assignment.dueDate), "MMM d, yyyy")}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Total Marks</div>
                          <div className="flex items-center gap-1">
                            <File className="h-3.5 w-3.5 text-gray-500" />
                            <span>{assignment.totalMarks}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Submissions</div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            <span>{assignment.submittedCount}/{assignment.totalStudents || '-'}</span>
                            {assignment.pendingCount > 0 && (
                              <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 hover:bg-amber-50">
                                {assignment.pendingCount} to grade
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm">
                        <BarChart4 className="mr-1 h-4 w-4" /> View Statistics
                      </Button>
                      <div className="space-x-2">
                        <Link href={`/teacher/assessments/assignments/${assignment.id}/edit`}>
                          <Button size="sm" variant="outline">
                            <Edit className="mr-1 h-4 w-4" /> Edit
                          </Button>
                        </Link>
                        <Link href={`/teacher/assessments/assignments/${assignment.id}`}>
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
                      <h3 className="font-medium text-lg">No Active Assignments</h3>
                      <p className="text-gray-500 max-w-md mt-1">
                        There are no active assignments currently. Create a new assignment to get started.
                      </p>
                      <div className="mt-4">
                        <Link href="/teacher/assessments/assignments/create">
                          <Button>
                            <PlusCircle className="mr-2 h-4 w-4" /> Create Assignment
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
              {completedAssignments.length > 0 ? (
                completedAssignments.map((assignment) => (
                  <Card key={assignment.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{assignment.title}</CardTitle>
                          <CardDescription>
                            {assignment.subject} • {assignment.classes.map((cls: any) => cls.name).join(", ")}
                          </CardDescription>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Completed</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-gray-500">Due Date</div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-gray-500" />
                            <span>{format(new Date(assignment.dueDate), "MMM d, yyyy")}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Submissions</div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            <span>{assignment.submittedCount}/{assignment.totalStudents || '-'}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Graded</div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            <span>{assignment.gradedCount}/{assignment.submittedCount}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Average Score</div>
                          <div className="flex items-center gap-1 font-medium">
                            <span>{assignment.avgScore}</span>
                            <span className="text-xs text-gray-500">
                              out of {assignment.totalMarks}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm">
                        <Download className="mr-1 h-4 w-4" /> Export Results
                      </Button>
                      <Link href={`/teacher/assessments/assignments/${assignment.id}`}>
                        <Button size="sm">
                          <ClipboardList className="mr-1 h-4 w-4" /> View Results
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8">
                    <div className="flex flex-col items-center justify-center text-center">
                      <AlertCircle className="h-10 w-10 text-gray-400 mb-2" />
                      <h3 className="font-medium text-lg">No Completed Assignments</h3>
                      <p className="text-gray-500 max-w-md mt-1">
                        There are no completed assignments yet. Once assignments pass their due date, they will appear here.
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

