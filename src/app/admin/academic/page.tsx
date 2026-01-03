export const dynamic = 'force-dynamic';

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PlusCircle, Calendar, Clock, Building2, GraduationCap, BookOpen, FileText, AlertCircle } from "lucide-react";
import { getAcademicOverview, getAcademicYears } from "@/lib/actions/academicActions";
import { formatDate } from "@/lib/utils";
import { AcademicErrorBoundary } from "@/components/academic/academic-error-boundary";

async function AcademicPageContent() {
  const [overviewResult, yearsResult] = await Promise.all([
    getAcademicOverview(),
    getAcademicYears(),
  ]);

  const overview = overviewResult.success && overviewResult.data ? overviewResult.data : undefined;
  const academicYears = yearsResult.success && yearsResult.data ? yearsResult.data : [];
  const hasError = !overviewResult.success || !yearsResult.success;
  const errorMessage = !overviewResult.success ? overviewResult.error : undefined;

  const academicSections = [
    {
      title: "Academic Years",
      icon: <Calendar className="h-5 w-5" />,
      description: "Manage school academic years",
      href: "/admin/academic/academic-years",
      count: overview?.academicYears ?? 0
    },
    {
      title: "Terms",
      icon: <Clock className="h-5 w-5" />,
      description: "Manage terms and semesters",
      href: "/admin/academic/terms",
      count: overview?.terms ?? 0
    },
    {
      title: "Departments",
      icon: <Building2 className="h-5 w-5" />,
      description: "Manage academic departments",
      href: "/admin/academic/departments",
      count: overview?.departments ?? 0
    },
    {
      title: "Grades",
      icon: <GraduationCap className="h-5 w-5" />,
      description: "Configure grading system",
      href: "/admin/academic/grades",
      count: overview?.grades ?? 0
    },
    {
      title: "Curriculum",
      icon: <BookOpen className="h-5 w-5" />,
      description: "Manage curriculum structure",
      href: "/admin/academic/curriculum",
      count: overview?.curriculum ?? 0
    },
    {
      title: "Syllabus",
      icon: <FileText className="h-5 w-5" />,
      description: "Subject syllabuses",
      href: "/admin/academic/syllabus",
      count: overview?.syllabus ?? 0
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
        <Link href="/admin/academic/academic-years">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Academic Year
          </Button>
        </Link>
      </div>

      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {errorMessage || "An error occurred while loading academic data"}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {academicSections.map((section) => (
          <Card key={section.title} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-md text-primary">
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
              <div className="rounded-full bg-muted p-6 mb-4">
                <Calendar className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No academic years yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Get started by creating your first academic year to organize your school calendar.
              </p>
              <Link href="/admin/academic/academic-years">
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
                    <tr className="bg-accent border-b">
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Year Name</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Start Date</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">End Date</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Terms</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Classes</th>
                      <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {academicYears.map((year) => (
                      <tr key={year.id} className="border-b hover:bg-accent/50">
                        <td className="py-3 px-4 align-middle font-medium">{year.name}</td>
                        <td className="py-3 px-4 align-middle">{formatDate(year.startDate)}</td>
                        <td className="py-3 px-4 align-middle">{formatDate(year.endDate)}</td>
                        <td className="py-3 px-4 align-middle">
                          <Badge 
                            variant={year.isCurrent ? 'default' : 'secondary'}
                            className={
                              year.isCurrent ? 'bg-green-600 hover:bg-green-700' :
                              new Date(year.endDate) < new Date() ? 'bg-gray-500 hover:bg-gray-600' :
                              'bg-blue-600 hover:bg-blue-700'
                            }
                          >
                            {year.isCurrent ? 'Current' : new Date(year.startDate) > new Date() ? 'Planned' : 'Past'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 align-middle">{'_count' in year ? year._count.terms : year.termsCount}</td>
                        <td className="py-3 px-4 align-middle">{'_count' in year ? year._count.classes : year.classesCount}</td>
                        <td className="py-3 px-4 align-middle text-right">
                          <Link href={`/admin/academic/academic-years/${year.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
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

export default function AcademicPage() {
  return (
    <AcademicErrorBoundary context="overview">
      <AcademicPageContent />
    </AcademicErrorBoundary>
  );
}
