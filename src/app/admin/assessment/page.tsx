"use client";

import { useState } from "react";
import Link from "next/link";
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

const upcomingExams = [
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

const recentAssessments = [
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
                        {upcomingExams.map((exam) => (
                          <tr key={exam.id} className="border-b">
                            <td className="py-3 px-4 align-middle">
                              <div className="font-medium">{exam.subject}</div>
                              <div className="text-xs text-gray-500">{exam.type}</div>
                            </td>
                            <td className="py-3 px-4 align-middle">{exam.grade}</td>
                            <td className="py-3 px-4 align-middle">
                              <div className="flex items-center gap-1.5">
                                <CalendarClock className="h-3.5 w-3.5 text-gray-500" />
                                <span>{exam.date}</span>
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
                        {recentAssessments.map((assessment) => (
                          <tr key={assessment.id} className="border-b">
                            <td className="py-3 px-4 align-middle">
                              <div className="font-medium">{assessment.name}</div>
                              <div className="text-xs text-gray-500">{assessment.grade} • {assessment.date}</div>
                            </td>
                            <td className="py-3 px-4 align-middle">{assessment.subject}</td>
                            <td className="py-3 px-4 align-middle">{assessment.submissions}</td>
                            <td className="py-3 px-4 align-middle">
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                {assessment.avgScore}
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
          <div className="py-10 text-center">
            <BarChart className="h-10 w-10 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">Performance Analytics Coming Soon</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
              Detailed analytics on student performance, exam results, and academic trends will be available here.
            </p>
            <Button variant="outline">Explore Sample Report</Button>
          </div>
        </TabsContent>
        
        <TabsContent value="timeline">
          <div className="py-10 text-center">
            <CalendarClock className="h-10 w-10 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">Assessment Timeline Coming Soon</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
              View and plan your academic year's assessment schedule with our interactive timeline tool.
            </p>
            <Button variant="outline">View Academic Calendar</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
