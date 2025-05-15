import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

const assessmentCategories = [
  {
    title: "Exam Types",
    description: "Standardized exam formats",
    href: "/admin/assessment/exam-types",
    count: 6
  },
  {
    title: "Exams",
    description: "Scheduled assessments",
    href: "/admin/assessment/exams",
    count: 124
  },
  {
    title: "Assignments",
    description: "Homework and projects",
    href: "/admin/assessment/assignments",
    count: 286
  },
  {
    title: "Results",
    description: "Grade management",
    href: "/admin/assessment/results",
    count: 1242
  },
  {
    title: "Report Cards",
    description: "Student performance reports",
    href: "/admin/assessment/report-cards",
    count: 1245
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

export default function AssessmentPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Assessment Management</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" /> New Exam
          </Button>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> New Assignment
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {assessmentCategories.map((category) => (
          <Card key={category.title} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{category.title}</CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-3xl font-bold">{category.count}</div>
                <Link href={category.href}>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </Link>
              </div>
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
                          <div>{exam.date}</div>
                          <div className="text-xs text-gray-500">{exam.time}</div>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                            {exam.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                          <Button variant="ghost" size="sm">View</Button>
                          <Button variant="ghost" size="sm">Edit</Button>
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
                        <td className="py-3 px-4 align-middle">{assessment.avgScore}</td>
                        <td className="py-3 px-4 align-middle text-right">
                          <Button variant="ghost" size="sm">Results</Button>
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
    </div>
  );
}
