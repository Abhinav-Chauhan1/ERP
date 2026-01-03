"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Calendar, Award, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  getStudentReportCards,
  getAvailableTerms,
  getAvailableAcademicYears,
  type ReportCardListItem,
} from "@/lib/actions/report-card-actions";
import { useSession } from "next-auth/react";
import { useAuth } from "@/lib/auth-context";
import { ReportCardErrorBoundary } from "@/components/shared/report-card-error-boundary";

function StudentReportCardsPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportCards, setReportCards] = useState<ReportCardListItem[]>([]);
  const [terms, setTerms] = useState<Array<{ id: string; name: string; academicYearId: string; academicYearName: string }>>([]);
  const [academicYears, setAcademicYears] = useState<Array<{ id: string; name: string; isCurrent: boolean }>>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>("all");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("all");
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!userId) {
          router.push("/login");
          return;
        }

        // Get student ID from user
        const response = await fetch("/api/users/me");

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const userData = await response.json();

        if (!userData.student) {
          router.push("/login");
          return;
        }

        setStudentId(userData.student.id);

        // Fetch terms and academic years for filters
        const [termsResult, academicYearsResult] = await Promise.all([
          getAvailableTerms(),
          getAvailableAcademicYears(),
        ]);

        if (termsResult.success && termsResult.data) {
          setTerms(termsResult.data);
        } else {
          console.error("Error fetching terms:", termsResult.error);
        }

        if (academicYearsResult.success && academicYearsResult.data) {
          setAcademicYears(academicYearsResult.data);
        } else {
          console.error("Error fetching academic years:", academicYearsResult.error);
        }

        // Fetch report cards
        const reportCardsResult = await getStudentReportCards(userData.student.id);

        if (reportCardsResult.success && reportCardsResult.data) {
          setReportCards(reportCardsResult.data);
        } else {
          setError(reportCardsResult.error || "Failed to fetch report cards");
          console.error("Error fetching report cards:", reportCardsResult.error);
        }
      } catch (error) {
        console.error("Error fetching report cards:", error);
        setError(error instanceof Error ? error.message : "An unexpected error occurred while loading report cards");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, router]);

  // Filter report cards based on selected filters
  const filteredReportCards = reportCards.filter((rc) => {
    if (selectedTerm !== "all") {
      const term = terms.find((t) => t.id === selectedTerm);
      if (term && rc.termName !== term.name) {
        return false;
      }
    }

    if (selectedAcademicYear !== "all") {
      const selectedYear = academicYears.find((ay) => ay.id === selectedAcademicYear);
      if (selectedYear && rc.academicYear !== selectedYear.name) {
        return false;
      }
    }

    return true;
  });

  const handleDownload = (pdfUrl: string) => {
    window.open(pdfUrl, "_blank");
  };

  const handleViewDetails = (reportCardId: string) => {
    router.push(`/student/assessments/report-cards/${reportCardId}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Report Cards</h1>
        <p className="text-muted-foreground mt-1">
          View and download your published report cards
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter report cards by term or academic year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Academic Year</label>
              <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                <SelectTrigger>
                  <SelectValue placeholder="All Academic Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Academic Years</SelectItem>
                  {academicYears.map((ay) => (
                    <SelectItem key={ay.id} value={ay.id}>
                      {ay.name} {ay.isCurrent && "(Current)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Term</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="All Terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  {terms.map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.name} - {term.academicYearName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Cards Grid */}
      {filteredReportCards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No report cards available</p>
            <p className="text-sm text-muted-foreground mt-1">
              Report cards will appear here once they are published by your school
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReportCards.map((reportCard) => (
            <Card key={reportCard.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{reportCard.termName}</CardTitle>
                    <CardDescription>{reportCard.academicYear}</CardDescription>
                  </div>
                  <Badge variant="secondary">
                    <Calendar className="h-3 w-3 mr-1" />
                    Published
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Performance Summary */}
                <div className="space-y-2">
                  {reportCard.percentage !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Percentage</span>
                      <span className="text-lg font-bold">{reportCard.percentage.toFixed(2)}%</span>
                    </div>
                  )}

                  {reportCard.grade && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Grade</span>
                      <Badge variant="outline" className="text-base">
                        <Award className="h-3 w-3 mr-1" />
                        {reportCard.grade}
                      </Badge>
                    </div>
                  )}

                  {reportCard.rank !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Class Rank</span>
                      <Badge variant="outline">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        #{reportCard.rank}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewDetails(reportCard.id)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  {reportCard.pdfUrl && (
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownload(reportCard.pdfUrl!)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>

                {/* Published Date */}
                {reportCard.publishDate && (
                  <p className="text-xs text-muted-foreground text-center pt-2 border-t">
                    Published on {new Date(reportCard.publishDate).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StudentReportCardsPage() {
  return (
    <ReportCardErrorBoundary userType="student">
      <StudentReportCardsPageContent />
    </ReportCardErrorBoundary>
  );
}
