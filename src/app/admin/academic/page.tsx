import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Calendar, Clock, Building2, GraduationCap, BookOpen, FileText } from "lucide-react";
import { getAcademicOverview, getAcademicYears } from "@/lib/actions/academicActions";
import { formatDate } from "@/lib/utils";

export default async function AcademicPage() {
  const [overviewResult, yearsResult] = await Promise.all([
    getAcademicOverview(),
    getAcademicYears(),
  ]);

  const overview = overviewResult.success ? overviewResult.data : {
    academicYears: 0,
    terms: 0,
    departments: 0,
    grades: 0,
    curriculum: 0,
    syllabus: 0,
  };

  const academicYears = yearsResult.success ? yearsResult.data : [];

  const academicSections = [
    {
      title: "Academic Years",
      icon: <Calendar className="h-5 w-5" />,
      description: "Manage school academic years",
      href: "/admin/academic/academic-years",
      count: overview.academicYears
    },
    {
      title: "Terms",
      icon: <Clock className="h-5 w-5" />,
      description: "Manage terms and semesters",
      href: "/admin/academic/terms",
      count: overview.terms
    },
    {
      title: "Departments",
      icon: <Building2 className="h-5 w-5" />,
      description: "Manage academic departments",
      href: "/admin/academic/departments",
      count: overview.departments
    },
    {
      title: "Grades",
      icon: <GraduationCap className="h-5 w-5" />,
      description: "Configure grading system",
      href: "/admin/academic/grades",
      count: overview.grades
    },
    {
      title: "Curriculum",
      icon: <BookOpen className="h-5 w-5" />,
      description: "Manage curriculum structure",
      href: "/admin/academic/curriculum",
      count: overview.curriculum
    },
    {
      title: "Syllabus",
      icon: <FileText className="h-5 w-5" />,
      description: "Subject syllabuses",
      href: "/admin/academic/syllabus",
      count: overview.syllabus
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Academic Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage academic structure and curriculum
          </p>
        </div>
        <Link href="/admin/academic/academic-years/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Academic Year
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {academicSections.map((section) => (
          <Card key={section.title} className="overflow-hidden hover:shadow-md transition-shadow">
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
          <CardTitle className="text-xl">Academic Years</CardTitle>
          <CardDescription>
            Overview of active and planned academic years
          </CardDescription>
        </CardHeader>
        <CardContent>
          {academicYears.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-gray-100 p-6 mb-4">
                <Calendar className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No academic years yet</h3>
              <p className="text-gray-500 mb-6 max-w-sm">
                Get started by creating your first academic year to organize your school calendar.
              </p>
              <Link href="/admin/academic/academic-years/create">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Academic Year
                </Button>
              </Link>
            </div>
          ) : (
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
                    {academicYears.map((year) => (
                      <tr key={year.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 align-middle font-medium">{year.name}</td>
                        <td className="py-3 px-4 align-middle">{formatDate(year.startDate)}</td>
                        <td className="py-3 px-4 align-middle">{formatDate(year.endDate)}</td>
                        <td className="py-3 px-4 align-middle">
                          <Badge 
                            className={
                              year.status === 'Current' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                              year.status === 'Past' ? 'bg-gray-100 text-gray-800 hover:bg-gray-100' :
                              'bg-blue-100 text-blue-800 hover:bg-blue-100'
                            }
                          >
                            {year.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 align-middle">{year.termsCount}</td>
                        <td className="py-3 px-4 align-middle">{year.classesCount}</td>
                        <td className="py-3 px-4 align-middle text-right">
                          <Link href={`/admin/academic/academic-years/${year.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                          <Link href={`/admin/academic/academic-years/${year.id}/edit`}>
                            <Button variant="ghost" size="sm">Edit</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
