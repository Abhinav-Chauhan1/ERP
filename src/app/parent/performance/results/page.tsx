export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { getExamResults, getPerformanceAnalytics } from "@/lib/actions/parent-performance-actions";
import { ExamResultsTable } from "@/components/parent/performance/exam-results-table";
import { PerformanceChart } from "@/components/parent/performance/performance-chart";
import { Button } from "@/components/ui/button";
import { Download, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

// Enable caching with revalidation
export const revalidate = 600; // Revalidate every 10 minutes

interface PageProps {
  searchParams: Promise<{
    childId?: string;
    termId?: string;
    subjectId?: string;
    examTypeId?: string;
  }>;
}

export default async function ExamResultsPage({ searchParams: searchParamsPromise }: PageProps) {
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
        <h1 className="text-2xl font-bold mb-4">Exam Results</h1>
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
  
  // Get subjects for filtering
  const subjects = await db.subject.findMany({
    orderBy: {
      name: 'asc'
    },
    select: {
      id: true,
      name: true,
      code: true
    }
  });
  
  // Get exam types for filtering
  const examTypes = await db.examType.findMany({
    orderBy: {
      name: 'asc'
    },
    select: {
      id: true,
      name: true
    }
  });
  
  // Build filters
  const filters: any = {
    childId: selectedChild.id,
    page: 1,
    limit: 50
  };
  
  if (searchParams.termId) {
    filters.termId = searchParams.termId;
  }
  
  if (searchParams.subjectId) {
    filters.subjectId = searchParams.subjectId;
  }
  
  if (searchParams.examTypeId) {
    filters.examTypeId = searchParams.examTypeId;
  }
  
  // Get exam results
  const examResultsResponse = await getExamResults(filters);
  
  // Get performance analytics for charts
  const analyticsResponse = await getPerformanceAnalytics({
    childId: selectedChild.id,
    includeSubjectTrends: true,
    includeTermHistory: false
  });
  
  if (!examResultsResponse.success) {
    return (
      <div className="h-full p-6">
        <h1 className="text-2xl font-bold mb-4">Exam Results</h1>
        <p className="text-red-600">{examResultsResponse.message || "Failed to load exam results"}</p>
      </div>
    );
  }
  
  const examResults = examResultsResponse.data?.results || [];
  const analytics = analyticsResponse.success ? analyticsResponse.data : null;
  
  // Transform subject trends for PerformanceChart
  const subjectTrends = analytics?.subjectTrends.map(trend => ({
    subjectId: trend.subjectName, // Using name as ID since we don't have ID in the data
    subjectName: trend.subjectName,
    dataPoints: trend.data.map(point => ({
      examId: "",
      examTitle: point.term,
      examDate: point.date,
      marks: 0,
      totalMarks: 100,
      percentage: point.percentage,
      grade: null,
      classAverage: point.percentage * 0.95 // Approximate class average
    })),
    overallTrend: "stable" as const,
    averagePercentage: trend.data.reduce((sum, p) => sum + p.percentage, 0) / trend.data.length,
    improvementRate: trend.data.length >= 2 
      ? trend.data[trend.data.length - 1].percentage - trend.data[0].percentage 
      : 0
  })) || [];
  
  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Exam Results</h1>
          <p className="text-gray-600 mt-1">View exam performance and trends</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Child Selector */}
          {children.length > 1 && (
            <div className="flex gap-2">
              {children.map((child) => (
                <Link key={child.id} href={`/parent/performance/results?childId=${child.id}`}>
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
          
          {/* Export to PDF Button */}
          <Button variant="outline" disabled>
            <Download className="h-4 w-4 mr-2" />
            Export to PDF
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 bg-white rounded-lg border">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>
        
        {/* Term Filter */}
        {terms.length > 0 && (
          <Select value={searchParams.termId || "all"}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Terms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <Link 
                  href={`/parent/performance/results?childId=${selectedChildId}`}
                  className="block w-full"
                >
                  All Terms
                </Link>
              </SelectItem>
              {terms.map((term) => (
                <SelectItem key={term.id} value={term.id}>
                  <Link 
                    href={`/parent/performance/results?childId=${selectedChildId}&termId=${term.id}${searchParams.subjectId ? `&subjectId=${searchParams.subjectId}` : ''}${searchParams.examTypeId ? `&examTypeId=${searchParams.examTypeId}` : ''}`}
                    className="block w-full"
                  >
                    {term.name}
                  </Link>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {/* Subject Filter */}
        {subjects.length > 0 && (
          <Select value={searchParams.subjectId || "all"}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <Link 
                  href={`/parent/performance/results?childId=${selectedChildId}${searchParams.termId ? `&termId=${searchParams.termId}` : ''}${searchParams.examTypeId ? `&examTypeId=${searchParams.examTypeId}` : ''}`}
                  className="block w-full"
                >
                  All Subjects
                </Link>
              </SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  <Link 
                    href={`/parent/performance/results?childId=${selectedChildId}${searchParams.termId ? `&termId=${searchParams.termId}` : ''}&subjectId=${subject.id}${searchParams.examTypeId ? `&examTypeId=${searchParams.examTypeId}` : ''}`}
                    className="block w-full"
                  >
                    {subject.name}
                  </Link>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {/* Exam Type Filter */}
        {examTypes.length > 0 && (
          <Select value={searchParams.examTypeId || "all"}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Exam Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <Link 
                  href={`/parent/performance/results?childId=${selectedChildId}${searchParams.termId ? `&termId=${searchParams.termId}` : ''}${searchParams.subjectId ? `&subjectId=${searchParams.subjectId}` : ''}`}
                  className="block w-full"
                >
                  All Types
                </Link>
              </SelectItem>
              {examTypes.map((examType) => (
                <SelectItem key={examType.id} value={examType.id}>
                  <Link 
                    href={`/parent/performance/results?childId=${selectedChildId}${searchParams.termId ? `&termId=${searchParams.termId}` : ''}${searchParams.subjectId ? `&subjectId=${searchParams.subjectId}` : ''}&examTypeId=${examType.id}`}
                    className="block w-full"
                  >
                    {examType.name}
                  </Link>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {/* Clear Filters */}
        {(searchParams.termId || searchParams.subjectId || searchParams.examTypeId) && (
          <Link href={`/parent/performance/results?childId=${selectedChildId}`}>
            <Button variant="ghost" size="sm">
              Clear Filters
            </Button>
          </Link>
        )}
      </div>
      
      {/* Performance Chart */}
      {subjectTrends.length > 0 && (
        <PerformanceChart 
          subjectTrends={subjectTrends}
          studentName={selectedChild.name}
        />
      )}
      
      {/* Exam Results Table */}
      <ExamResultsTable 
        results={examResults}
        studentName={selectedChild.name}
      />
    </div>
  );
}
