import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Calendar, Clock, Building2, GraduationCap, BookOpen, FileText } from "lucide-react";

const academicSections = [
  {
    title: "Academic Years",
    icon: <Calendar className="h-5 w-5" />,
    description: "Manage school academic years",
    href: "/admin/academic/academic-years",
    count: 4
  },
  {
    title: "Terms",
    icon: <Clock className="h-5 w-5" />,
    description: "Manage terms and semesters",
    href: "/admin/academic/terms",
    count: 12
  },
  {
    title: "Departments",
    icon: <Building2 className="h-5 w-5" />,
    description: "Manage academic departments",
    href: "/admin/academic/departments",
    count: 8
  },
  {
    title: "Grades",
    icon: <GraduationCap className="h-5 w-5" />,
    description: "Configure grading system",
    href: "/admin/academic/grades",
    count: 5
  },
  {
    title: "Curriculum",
    icon: <BookOpen className="h-5 w-5" />,
    description: "Manage curriculum structure",
    href: "/admin/academic/curriculum",
    count: 6
  },
  {
    title: "Syllabus",
    icon: <FileText className="h-5 w-5" />,
    description: "Subject syllabuses",
    href: "/admin/academic/syllabus",
    count: 48
  },
];

const currentAcademicYears = [
  {
    id: "1",
    name: "2023-2024",
    startDate: "August 15, 2023",
    endDate: "May 31, 2024",
    status: "Current",
    terms: 3,
    classes: 32
  },
  {
    id: "2",
    name: "2022-2023",
    startDate: "August 16, 2022",
    endDate: "June 1, 2023",
    status: "Past",
    terms: 3,
    classes: 30
  },
  {
    id: "3",
    name: "2024-2025",
    startDate: "August 14, 2024",
    endDate: "May 30, 2025",
    status: "Planned",
    terms: 3,
    classes: 0
  },
];

export default function AcademicPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Academic Management</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Academic Year
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {academicSections.map((section) => (
          <Card key={section.title} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-md text-blue-700">
                  {section.icon}
                </div>
                <CardTitle className="text-lg">{section.title}</CardTitle>
              </div>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-3xl font-bold">{section.count}</div>
                <Link href={section.href}>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-xl">Current and Upcoming Academic Years</CardTitle>
          <CardDescription>
            Overview of active and planned academic years
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Year Name</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Start Date</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">End Date</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Terms</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Classes</th>
                    <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentAcademicYears.map((year) => (
                    <tr key={year.id} className="border-b">
                      <td className="py-3 px-4 align-middle font-medium">{year.name}</td>
                      <td className="py-3 px-4 align-middle">{year.startDate}</td>
                      <td className="py-3 px-4 align-middle">{year.endDate}</td>
                      <td className="py-3 px-4 align-middle">
                        <span 
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            year.status === 'Current' ? 'bg-green-100 text-green-800' :
                            year.status === 'Past' ? 'bg-gray-100 text-gray-800' :
                            'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {year.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 align-middle">{year.terms}</td>
                      <td className="py-3 px-4 align-middle">{year.classes}</td>
                      <td className="py-3 px-4 align-middle text-right">
                        <Link href={`/admin/academic/academic-years/${year.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
