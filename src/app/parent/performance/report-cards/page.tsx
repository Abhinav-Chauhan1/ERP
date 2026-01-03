"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Calendar, Award, TrendingUp, User, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  getParentChildrenReportCards,
  getAvailableTerms,
  getAvailableAcademicYears,
  type ReportCardListItem,
} from "@/lib/actions/report-card-actions";
import { useSession } from "next-auth/react";
import { ReportCardErrorBoundary } from "@/components/shared/report-card-error-boundary";

interface ChildInfo {
  id: string;
  name: string;
}

function ParentReportCardsPageContent() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [reportCardsMap, setReportCardsMap] = useState<Record<string, ReportCardListItem[]>>({});
  const [terms, setTerms] = useState<Array<{ id: string; name: string; academicYearId: string; academicYearName: string }>>([]);
  const [academicYears, setAcademicYears] = useState<Array<{ id: string; name: string; isCurrent: boolean }>>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>("all");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("all");
  const [selectedChild, setSelectedChild] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!userId) {
          router.push("/login");
          return;
        }

        // Get parent and children data
        const response = await fetch("/api/users/me");

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const userData = await response.json();

        if (!userData.parent) {
          router.push("/login");
          return;
        }

        // Fetch children information
        const childrenResponse = await fetch("/api/parent/children");

        if (!childrenResponse.ok) {
          throw new Error("Failed to fetch children data");
        }

        const childrenData = await childrenResponse.json();

        if (childrenData.success && childrenData.data) {
          setChildren(childrenData.data);
          if (childrenData.data.length > 0) {
            setSelectedChild(childrenData.data[0].id);
          }
        } else {
          console.error("Error fetching children:", childrenData.error);
        }

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

        // Fetch report cards for all children
        const reportCardsResult = await getParentChildrenReportCards();

        if (reportCardsResult.success && reportCardsResult.data) {
          setReportCardsMap(reportCardsResult.data);
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

  // Get report cards for selected child
  const getFilteredReportCards = (childId: string): ReportCardListItem[] => {
    const childReportCards = reportCardsMap[childId] || [];

    return childReportCards.filter((rc) => {
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
  };

  const handleDownload = (pdfUrl: string) => {
    window.open(pdfUrl, "_blank");
  };

  const handleViewDetails = (reportCardId: string) => {
    router.push(`/parent/performance/report-cards/${reportCardId}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-10" />
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

  if (children.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Report Cards</h1>
          <p className="text-muted-foreground mt-1">
            View and download report cards for your children
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No children found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Please contact the school to link your children to your account
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Report Cards</h1>
        <p className="text-muted-foreground mt-1">
          View and download report cards for your children
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
          <CardDescription>Filter report cards by child, term, or academic year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Child</label>
              <Select value={selectedChild} onValueChange={setSelectedChild}>
                <SelectTrigger>
                  <SelectValue placeholder="Select child" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Children</SelectItem>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

      {/* Report Cards by Child */}
      {selectedChild === "all" ? (
        // Show tabs for all children
        <Tabs value={children[0]?.id} className="space-y-4">
          <TabsList>
            {children.map((child) => (
              <TabsTrigger key={child.id} value={child.id}>
                {child.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {children.map((child) => (
            <TabsContent key={child.id} value={child.id} className="space-y-4">
              <ReportCardsGrid
                reportCards={getFilteredReportCards(child.id)}
                childName={child.name}
                onDownload={handleDownload}
                onViewDetails={handleViewDetails}
              />
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        // Show report cards for selected child
        <ReportCardsGrid
          reportCards={getFilteredReportCards(selectedChild)}
          childName={children.find((c) => c.id === selectedChild)?.name || ""}
          onDownload={handleDownload}
          onViewDetails={handleViewDetails}
        />
      )}
    </div>
  );
}

export default function ParentReportCardsPage() {
  return (
    <ReportCardErrorBoundary userType="parent">
      <ParentReportCardsPageContent />
    </ReportCardErrorBoundary>
  );
}

interface ReportCardsGridProps {
  reportCards: ReportCardListItem[];
  childName: string;
  onDownload: (pdfUrl: string) => void;
  onViewDetails: (reportCardId: string) => void;
}

function ReportCardsGrid({ reportCards, childName, onDownload, onViewDetails }: ReportCardsGridProps) {
  if (reportCards.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No report cards available</p>
          <p className="text-sm text-muted-foreground mt-1">
            Report cards for {childName} will appear here once they are published
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {reportCards.map((reportCard) => (
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
                onClick={() => onViewDetails(reportCard.id)}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Details
              </Button>
              {reportCard.pdfUrl && (
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={() => onDownload(reportCard.pdfUrl!)}
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
  );
}
