"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, BarChart, ArrowUpRight, 
  CalendarClock, FileText, BookOpen,
  GraduationCap, CheckSquare, ClipboardList,
  FileQuestion, Badge as BadgeIcon, Book
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUpcomingExams, getRecentExams } from "@/lib/actions/examsActions";
import { getRecentAssignments } from "@/lib/actions/assignmentsActions";
import {
  getPerformanceAnalytics,
  getSubjectWisePerformance,
  getPassFailRates,
  getTopPerformers,
} from "@/lib/actions/performanceAnalyticsActions";
import {
  getTimelineByMonth,
  getTimelineStats,
} from "@/lib/actions/assessmentTimelineActions";
import { Chart } from "@/components/dashboard/chart";

const assessmentCategories = [
  {
    title: "Exam Types",
    icon: <ClipboardList className="h-5 w-5 text-indigo-600" />,
    description: "Standardized exam formats",
    href: "/admin/assessment/exam-types",
    count: 6
  },
  {
    title: "Exams",
    icon: <FileText className="h-5 w-5 text-blue-600" />,
    description: "Scheduled assessments",
    href: "/admin/assessment/exams",
    count: 124
  },
  {
    title: "Assignments",
    icon: <CheckSquare className="h-5 w-5 text-green-600" />,
    description: "Homework and projects",
    href: "/admin/assessment/assignments",
    count: 286
  },
  {
    title: "Results",
    icon: <BarChart className="h-5 w-5 text-amber-600" />,
    description: "Grade management",
    href: "/admin/assessment/results",
    count: 1242
  },
  {
    title: "Report Cards",
    icon: <BadgeIcon className="h-5 w-5 text-purple-600" />,
    description: "Student performance reports",
    href: "/admin/assessment/report-cards",
    count: 1245
  },
  {
    title: "Question Bank",
    icon: <FileQuestion className="h-5 w-5 text-red-600" />,
    description: "Question repository",
    href: "/admin/assessment/question-bank",
    count: 2546
  },
];

const mockUpcomingExams = [
  {
    id: "1",
    name: "Mid-term Examination",
    type: "Mid Term",
    subject: "Mathematics",
    grade: "Grade 10",
    date: "Dec 10, 2023",
    time: "9:00 AM - 11:00 AM",
    status: "Scheduled"
  },
  {
    id: "2", 
    name: "Mid-term Examination",
    type: "Mid Term",
    subject: "Physics",
    grade: "Grade 10",
    date: "Dec 11, 2023",
    time: "9:00 AM - 11:00 AM",
    status: "Scheduled"
  },
  {
    id: "3",
    name: "Mid-term Examination",
    type: "Mid Term",
    subject: "Chemistry",
    grade: "Grade 10",
    date: "Dec 12, 2023",
    time: "9:00 AM - 11:00 AM",
    status: "Scheduled"
  },
  {
    id: "4",
    name: "Mid-term Examination",
    type: "Mid Term",
    subject: "English",
    grade: "Grade 10",
    date: "Dec 13, 2023",
    time: "9:00 AM - 11:00 AM",
    status: "Scheduled"
  },
];

const mockRecentAssessments = [
  {
    id: "1",
    name: "Quiz: Algebraic Equations",
    type: "Quiz",
    subject: "Mathematics",
    grade: "Grade 9",
    date: "Nov 29, 2023",
    submissions: "28/30",
    avgScore: "86%"
  },
  {
    id: "2",
    name: "Lab Report: Chemical Reactions",
    type: "Assignment",
    subject: "Chemistry",
    grade: "Grade 11",
    date: "Nov 28, 2023",
    submissions: "25/28",
    avgScore: "78%"
  },
  {
    id: "3",
    name: "Essay: Macbeth Analysis",
    type: "Assignment",
    subject: "English Literature",
    grade: "Grade 12",
    date: "Nov 27, 2023",
    submissions: "22/24",
    avgScore: "82%"
  },
  {
    id: "4",
    name: "Unit Test: World War II",
    type: "Test",
    subject: "History",
    grade: "Grade 10",
    date: "Nov 25, 2023",
    submissions: "32/32",
    avgScore: "74%"
  },
];

const examTypes = [
  { id: "1", name: "Mid Term" },
  { id: "2", name: "Final Term" },
];

const subjects = [
  { id: "1", name: "Mathematics" },
  { id: "2", name: "Physics" },
  { id: "3", name: "Chemistry" },
  { id: "4", name: "English" },
];

const grades = [
  { id: "1", name: "Grade 9" },
  { id: "2", name: "Grade 10" },
  { id: "3", name: "Grade 11" },
  { id: "4", name: "Grade 12" },
];

export default function AssessmentPage() {
  const [newExamDialogOpen, setNewExamDialogOpen] = useState(false);
  const [newAssignmentDialogOpen, setNewAssignmentDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [recentAssessments, setRecentAssessments] = useState<any[]>([]);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceStats, setPerformanceStats] = useState<any>(null);
  const [subjectPerformance, setSubjectPerformance] = useState<any[]>([]);
  const [passFailRates, setPassFailRates] = useState<any>(null);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineItems, setTimelineItems] = useState<any[]>([]);
  const [timelineStats, setTimelineStats] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [upcomingResult, recentExamsResult, recentAssignmentsResult] = await Promise.all([
        getUpcomingExams({ limit: 10 }),
        getRecentExams({ limit: 5 }),
        getRecentAssignments({ limit: 5 }),
      ]);

      if (upcomingResult.success && upcomingResult.data) {
        setUpcomingExams(upcomingResult.data);
      }

      // Combine recent exams and assignments
      const recentItems = [];
      if (recentExamsResult.success && recentExamsResult.data) {
        recentItems.push(...recentExamsResult.data.map((exam: any) => ({
          ...exam,
          type: 'exam',
        })));
      }
      if (recentAssignmentsResult.success && recentAssignmentsResult.data) {
        recentItems.push(...recentAssignmentsResult.data.map((assignment: any) => ({
          ...assignment,
          type: 'assignment',
        })));
      }
      
      // Sort by date and take top 10
      recentItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentAssessments(recentItems.slice(0, 10));

    } catch (error) {
      console.error("Error loading assessment data:", error);
      toast.error("Failed to load assessment data");
    } finally {
      setLoading(false);
    }
  };

  const loadPerformanceData = async () => {
    setPerformanceLoading(true);
    try {
      const [analyticsResult, subjectResult, passFailResult, topPerformersResult] = await Promise.all([
        getPerformanceAnalytics(),
        getSubjectWisePerformance(),
        getPassFailRates(),
        getTopPerformers(10),
      ]);

      if (analyticsResult.success && analyticsResult.data) {
        setPerformanceStats(analyticsResult.data.statistics);
      }

      if (subjectResult.success && subjectResult.data) {
        setSubjectPerformance(subjectResult.data);
      }

      if (passFailResult.success && passFailResult.data) {
        setPassFailRates(passFailResult.data);
      }

      if (topPerformersResult.success && topPerformersResult.data) {
        setTopPerformers(topPerformersResult.data);
      }
    } catch (error) {
      console.error("Error loading performance data:", error);
      toast.error("Failed to load performance data");
    } finally {
      setPerformanceLoading(false);
    }
  };

  const loadTimelineData = async () => {
    setTimelineLoading(true);
    try {
      const [timelineResult, statsResult] = await Promise.all([
        getTimelineByMonth(selectedYear, selectedMonth),
        getTimelineStats(
          new Date(selectedYear, selectedMonth - 1, 1),
          new Date(selectedYear, selectedMonth, 0, 23, 59, 59)
        ),
      ]);

      if (timelineResult.success && timelineResult.data) {
        setTimelineItems(timelineResult.data);
      }

      if (statsResult.success && statsResult.data) {
        setTimelineStats(statsResult.data);
      }
    } catch (error) {
      console.error("Error loading timeline data:", error);
      toast.error("Failed to load timeline data");
    } finally {
      setTimelineLoading(false);
    }
  };
  const [viewTab, setViewTab] = useState("overview");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Assessment Management</h1>
        <div className="flex gap-2">
          <Dialog open={newExamDialogOpen} onOpenChange={setNewExamDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" /> New Exam
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Exam</DialogTitle>
                <DialogDescription>
                  Create a new examination for students
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Exam Type</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select exam type" />
                    </SelectTrigger>
                    <SelectContent>
                      {examTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Grade</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((grade) => (
                        <SelectItem key={grade.id} value={grade.id}>
                          {grade.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Link href="/admin/assessment/exams">
                  <Button onClick={() => setNewExamDialogOpen(false)}>Continue</Button>
                </Link>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={newAssignmentDialogOpen} onOpenChange={setNewAssignmentDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> New Assignment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
                <DialogDescription>
                  Create a new assignment for students
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Grade</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((grade) => (
                        <SelectItem key={grade.id} value={grade.id}>
                          {grade.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Due Date</label>
                  <input
                    type="date"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
              <DialogFooter>
                <Link href="/admin/assessment/assignments">
                  <Button onClick={() => setNewAssignmentDialogOpen(false)}>Continue</Button>
                </Link>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="overview" onValueChange={setViewTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mt-4">
            {assessmentCategories.map((category) => (
              <Card key={category.title} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-gray-50 rounded-md">
                      {category.icon}
                    </div>
                    <Badge variant="outline">{category.count}</Badge>
                  </div>
                  <CardTitle className="text-base mt-2">{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={category.href}>
                    <Button variant="outline" size="sm" className="w-full">
                      Manage
                      <ArrowUpRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 mt-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Upcoming Exams</CardTitle>
                <CardDescription>
                  Exams scheduled for the next 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Exam</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Grade</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Date</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                          <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-500">
                              Loading...
                            </td>
                          </tr>
                        ) : upcomingExams.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-500">
                              No upcoming exams
                            </td>
                          </tr>
                        ) : (
                          upcomingExams.map((exam) => (
                            <tr key={exam.id} className="border-b">
                              <td className="py-3 px-4 align-middle">
                                <div className="font-medium">{exam.subject?.name || exam.title || "Exam"}</div>
                                <div className="text-xs text-gray-500">{exam.examType?.name || exam.type || "Assessment"}</div>
                              </td>
                              <td className="py-3 px-4 align-middle">
                                {exam.class?.name || "N/A"}{exam.section ? `-${exam.section.name}` : ""}
                              </td>
                              <td className="py-3 px-4 align-middle">
                                <div className="flex items-center gap-1.5">
                                  <CalendarClock className="h-3.5 w-3.5 text-gray-500" />
                                  <span>{new Date(exam.date).toLocaleDateString()}</span>
                              </div>
                              <div className="text-xs text-gray-500 ml-5">{exam.time}</div>
                            </td>
                            <td className="py-3 px-4 align-middle">
                              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                {exam.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 align-middle text-right">
                              <Link href={`/admin/assessment/exams/${exam.id}`}>
                                <Button variant="ghost" size="sm">View</Button>
                              </Link>
                              <Link href={`/admin/assessment/exams/${exam.id}/edit`}>
                                <Button variant="ghost" size="sm">Edit</Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-center p-4 border-t">
                    <Link href="/admin/assessment/exams">
                      <Button variant="outline" size="sm">View All Exams</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Recent Assessments</CardTitle>
                <CardDescription>
                  Recently completed assessments and grades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Assessment</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Subject</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Submissions</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Avg. Score</th>
                          <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-500">
                              Loading...
                            </td>
                          </tr>
                        ) : recentAssessments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-500">
                              No recent assessments
                            </td>
                          </tr>
                        ) : (
                          recentAssessments.map((assessment) => (
                            <tr key={assessment.id} className="border-b">
                              <td className="py-3 px-4 align-middle">
                                <div className="font-medium">
                                  {assessment.type === 'exam' 
                                    ? (assessment.subject?.name || assessment.title || "Exam")
                                    : (assessment.title || "Assignment")}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {assessment.class?.name || "N/A"} • {new Date(assessment.createdAt).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="py-3 px-4 align-middle">
                                {assessment.type === 'exam' ? assessment.subject?.name : assessment.subject?.name || "N/A"}
                              </td>
                              <td className="py-3 px-4 align-middle">
                                {assessment.type === 'exam' ? "Exam" : "Assignment"}
                              </td>
                              <td className="py-3 px-4 align-middle">
                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                  {assessment.type === 'exam' ? assessment.status : assessment.status}
                                </Badge>
                              </td>
                            <td className="py-3 px-4 align-middle text-right">
                              <Link href={`/admin/assessment/results?assessment=${assessment.id}`}>
                                <Button variant="ghost" size="sm">Results</Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-center p-4 border-t">
                    <Link href="/admin/assessment/results">
                      <Button variant="outline" size="sm">View All Results</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-xl">Assessment Metrics</CardTitle>
              <CardDescription>Performance overview of current academic year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-50 rounded-md text-blue-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Exams</p>
                      <p className="text-2xl font-bold">124</p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Badge className="bg-green-100 text-green-800 font-normal mr-2">+12%</Badge>
                    <span>vs previous term</span>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-50 rounded-md text-green-600">
                      <CheckSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Assignments</p>
                      <p className="text-2xl font-bold">286</p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Badge className="bg-green-100 text-green-800 font-normal mr-2">+8%</Badge>
                    <span>vs previous term</span>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-amber-50 rounded-md text-amber-600">
                      <BarChart className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Avg. Pass Rate</p>
                      <p className="text-2xl font-bold">82.5%</p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Badge className="bg-green-100 text-green-800 font-normal mr-2">+3.2%</Badge>
                    <span>vs previous term</span>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-50 rounded-md text-purple-600">
                      <Book className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Report Cards</p>
                      <p className="text-2xl font-bold">1,245</p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Badge className="bg-blue-100 text-blue-800 font-normal mr-2">100%</Badge>
                    <span>completion rate</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance">
          {!performanceStats && !performanceLoading && (
            <div className="py-10 text-center">
              <BarChart className="h-10 w-10 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">Load Performance Analytics</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                Click below to load detailed analytics on student performance and exam results.
              </p>
              <Button onClick={loadPerformanceData}>Load Analytics</Button>
            </div>
          )}

          {performanceLoading && (
            <div className="py-10 text-center">
              <div className="text-gray-500">Loading performance data...</div>
            </div>
          )}

          {performanceStats && !performanceLoading && (
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Results</CardDescription>
                    <CardTitle className="text-3xl">{performanceStats.totalResults}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Average Score</CardDescription>
                    <CardTitle className="text-3xl">{performanceStats.averageScore}%</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Pass Rate</CardDescription>
                    <CardTitle className="text-3xl text-green-600">{performanceStats.passRate}%</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Pass/Fail</CardDescription>
                    <CardTitle className="text-3xl">
                      {performanceStats.passCount}/{performanceStats.failCount}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Subject-wise Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Subject-wise Performance</CardTitle>
                    <CardDescription>Average scores by subject</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {subjectPerformance.length > 0 ? (
                      <div className="space-y-4">
                        {subjectPerformance.map((subject: any, index: number) => (
                          <div key={index}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">{subject.subject}</span>
                              <span className="text-sm font-medium">{subject.averageScore}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${subject.averageScore}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {subject.totalStudents} students • {subject.passRate}% pass rate
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">No subject data available</div>
                    )}
                  </CardContent>
                </Card>

                {/* Grade Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Grade Distribution</CardTitle>
                    <CardDescription>Student performance breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {passFailRates && (
                      <div className="space-y-3">
                        {Object.entries(passFailRates.gradeDistribution).map(([grade, count]: [string, any]) => (
                          <div key={grade} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="w-8 text-center">{grade}</Badge>
                              <span className="text-sm">
                                {grade === 'A' && '90-100%'}
                                {grade === 'B' && '80-89%'}
                                {grade === 'C' && '70-79%'}
                                {grade === 'D' && '60-69%'}
                                {grade === 'E' && '50-59%'}
                                {grade === 'F' && 'Below 50%'}
                              </span>
                            </div>
                            <span className="text-sm font-medium">{count} students</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Top Performers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                  <CardDescription>Students with highest average scores</CardDescription>
                </CardHeader>
                <CardContent>
                  {topPerformers.length > 0 ? (
                    <div className="rounded-md border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Rank</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Student</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Class</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Exams</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Avg Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topPerformers.map((performer: any, index: number) => (
                            <tr key={index} className="border-b">
                              <td className="py-3 px-4">
                                <Badge variant="outline">{index + 1}</Badge>
                              </td>
                              <td className="py-3 px-4 font-medium">
                                {performer.student.user.firstName} {performer.student.user.lastName}
                              </td>
                              <td className="py-3 px-4">
                                {performer.student.enrollments[0]?.class.name || "N/A"}
                              </td>
                              <td className="py-3 px-4">{performer.totalExams}</td>
                              <td className="py-3 px-4">
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                  {performer.averageScore}%
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">No performance data available</div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="timeline">
          <div className="space-y-6">
            {/* Month/Year Selector and Stats */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex gap-2">
                <Select 
                  value={selectedMonth.toString()} 
                  onValueChange={(value) => setSelectedMonth(parseInt(value))}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={selectedYear.toString()} 
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Button onClick={loadTimelineData} disabled={timelineLoading}>
                  {timelineLoading ? "Loading..." : "Load Timeline"}
                </Button>
              </div>

              {timelineStats && (
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{timelineStats.totalExams}</div>
                    <div className="text-xs text-gray-500">Exams</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{timelineStats.totalAssignments}</div>
                    <div className="text-xs text-gray-500">Assignments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{timelineStats.completedAssessments}</div>
                    <div className="text-xs text-gray-500">Completed</div>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            {timelineLoading ? (
              <div className="py-10 text-center text-gray-500">Loading timeline...</div>
            ) : timelineItems.length === 0 ? (
              <div className="py-10 text-center">
                <CalendarClock className="h-10 w-10 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Assessments Scheduled</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                  There are no exams or assignments scheduled for the selected period.
                </p>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Assessment Schedule</CardTitle>
                  <CardDescription>
                    {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {timelineItems.map((item, index) => {
                      const isExam = item.type === 'exam';
                      const isPast = new Date(item.date) < new Date();
                      
                      return (
                        <div key={item.id} className="flex gap-4">
                          {/* Date */}
                          <div className="flex flex-col items-center min-w-[60px]">
                            <div className="text-2xl font-bold">
                              {new Date(item.date).getDate()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(item.date).toLocaleString('default', { weekday: 'short' })}
                            </div>
                          </div>

                          {/* Timeline Line */}
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full ${isExam ? 'bg-blue-500' : 'bg-green-500'} ${isPast ? 'opacity-50' : ''}`}></div>
                            {index < timelineItems.length - 1 && (
                              <div className="w-0.5 h-full bg-gray-200 flex-1"></div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 pb-8">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{item.title}</h4>
                                  <Badge variant="outline" className={isExam ? 'bg-blue-50' : 'bg-green-50'}>
                                    {isExam ? 'Exam' : 'Assignment'}
                                  </Badge>
                                  {item.status === 'COMPLETED' && (
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                      Completed
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  {item.subtitle} • {item.class}{item.section ? `-${item.section}` : ''}
                                </div>
                                {item.description && (
                                  <div className="text-sm text-gray-600 mt-2">
                                    {item.description}
                                  </div>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
