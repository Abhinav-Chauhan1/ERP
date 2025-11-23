export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { getProgressReports, getPerformanceAnalytics, downloadReportCard } from "@/lib/actions/parent-performance-actions";
import { ProgressReportCard } from "@/components/parent/performance/progress-report-card";
import { GradeTrendChart } from "@/components/parent/performance/grade-trend-chart";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    childId?: string;
    termId?: string;
  }>;
}

export default async function ProgressReportsPage({ searchParams: searchParamsPromise }: PageProps) {
  // Await searchParams as required by Next.js 15
  const searchParams = await searchParamsPromise;
  // Get current user
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect("/login");
  }
  
  // Get user from database
  const dbUser = await db.user.findUnique({
    where: {
      clerkId: clerkUser.id
    }
  });
  
  if (!dbUser || dbUser.role !== UserRole.PARENT) {
    redirect("/login");
  }
  
  // Get parent record
  const parent = await db.parent.findUnique({
    where: {
      userId: dbUser.id
    }
  });
  
  if (!parent) {
    redirect("/login");
  }
  
  // Get all children of this parent
  const parentChildren = await db.studentParent.findMany({
    where: {
      parentId: parent.id
    },
    include: {
      student: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
            }
          },
          enrollments: {
            where: { status: "ACTIVE" },
            orderBy: {
              enrollDate: 'desc'
            },
            take: 1,
            include: {
              class: {
                include: {
                  academicYear: true
                }
              },
              section: true
            }
          }
        }
      }
    }
  });
  
  const children = parentChildren.map(pc => ({
    id: pc.student.id,
    name: `${pc.student.user.firstName} ${pc.student.user.lastName}`,
    class: pc.student.enrollments[0]?.class.name || "N/A",
    section: pc.student.enrollments[0]?.section.name || "N/A",
    academicYearId: pc.student.enrollments[0]?.class.academicYearId,
    isPrimary: pc.isPrimary
  }));
  
  if (children.length === 0) {
    return (
      <div className="h-full p-6">
        <h1 className="text-2xl font-bold mb-4">Progress Reports</h1>
        <p className="text-gray-700">No children found in your account.</p>
      </div>
    );
  }
  
  // Get selected child or default to first child
  const selectedChildId = searchParams.childId || children[0].id;
  const selectedChild = children.find(c => c.id === selectedChildId) || children[0];
  
  // Get terms for the selected child's academic year
  const terms = selectedChild.academicYearId ? await db.term.findMany({
    where: {
      academicYearId: selectedChild.academicYearId
    },
    orderBy: {
      startDate: 'desc'
    },
    select: {
      id: true,
      name: true
    }
  }) : [];
  
  // Build filters for progress reports
  const filters: any = {
    childId: selectedChild.id,
    includeUnpublished: false
  };
  
  if (searchParams.termId) {
    filters.termId = searchParams.termId;
  }
  
  // Get progress reports
  const progressReportsResponse = await getProgressReports(filters);
  
  // Get performance analytics for grade trend chart
  const analyticsResponse = await getPerformanceAnalytics({
    childId: selectedChild.id,
    includeTermHistory: true,
    includeSubjectTrends: false
  });
  
  if (!progressReportsResponse.success) {
    return (
      <div className="h-full p-6">
        <h1 className="text-2xl font-bold mb-4">Progress Reports</h1>
        <p className="text-red-600">{progressReportsResponse.message || "Failed to load progress reports"}</p>
      </div>
    );
  }
  
  const progressReports = progressReportsResponse.data?.reports || [];
  const analytics = analyticsResponse.success ? analyticsResponse.data : null;
  const termHistory = analytics?.termHistory || [];
  
  // Get the selected term report if a term is selected
  const selectedTermReport = searchParams.termId 
    ? progressReports.find(r => r.term.id === searchParams.termId)
    : progressReports[0]; // Default to most recent report
  
  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Progress Reports</h1>
          <p className="text-gray-600 mt-1">View detailed academic progress and report cards</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Child Selector */}
          {children.length > 1 && (
            <div className="flex gap-2">
              {children.map((child) => (
                <Link key={child.id} href={`/parent/performance/reports?childId=${child.id}`}>
                  <Button
                    variant={child.id === selectedChildId ? "default" : "outline"}
                    size="sm"
                  >
                    {child.name}
                  </Button>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Term Selector and Download Button */}
      {progressReports.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-lg border">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Select Term:</span>
          </div>
          
          {/* Term Selector */}
          <Select value={searchParams.termId || progressReports[0]?.term.id || "all"}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent>
              {progressReports.map((report) => (
                <SelectItem key={report.term.id} value={report.term.id}>
                  <Link 
                    href={`/parent/performance/reports?childId=${selectedChildId}&termId=${report.term.id}`}
                    className="block w-full"
                  >
                    {report.term.name}
                  </Link>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Download Report Card Button */}
          {selectedTermReport && (
            <Button variant="outline" disabled>
              <Download className="h-4 w-4 mr-2" />
              Download Report Card
            </Button>
          )}
        </div>
      )}
      
      {/* No Reports Message */}
      {progressReports.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No progress reports are available yet. Reports will be published by the school at the end of each term.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Grade Trend Chart */}
      {termHistory.length > 0 && (
        <GradeTrendChart 
          termHistory={termHistory}
          studentName={selectedChild.name}
        />
      )}
      
      {/* Progress Report Card */}
      {selectedTermReport && (
        <ProgressReportCard report={selectedTermReport} />
      )}
      
      {/* All Reports List (if no specific term selected and multiple reports exist) */}
      {!searchParams.termId && progressReports.length > 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">All Reports</h2>
          <div className="grid gap-4">
            {progressReports.map((report) => (
              <Link 
                key={report.id}
                href={`/parent/performance/reports?childId=${selectedChildId}&termId=${report.term.id}`}
              >
                <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{report.term.name}</h3>
                      <p className="text-sm text-gray-600">
                        {report.term.academicYear}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {report.academicPerformance.grade || "N/A"}
                      </div>
                      <p className="text-sm text-gray-600">
                        {report.academicPerformance.percentage?.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
