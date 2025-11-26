import { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { Award, Download, FileText, BarChart2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getReportCards } from "@/lib/actions/student-assessment-actions";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Report Cards | Student Portal",
  description: "View your term and annual report cards",
};

export default async function ReportCardsPage() {
  const reportCards = await getReportCards();
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Report Cards</h1>
        <p className="text-muted-foreground mt-1">
          View your term and annual academic report cards
        </p>
      </div>
      
      {reportCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportCards.map(reportCard => (
            <Card key={reportCard.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-2 bg-gradient-to-r from-blue-600 to-purple-600"></div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center text-lg">
                    <div className="p-2 bg-blue-100 rounded-md text-blue-600 mr-2">
                      <Award className="h-5 w-5" />
                    </div>
                    {reportCard.term}
                  </CardTitle>
                  <Badge variant="outline">{reportCard.academicYear}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 bg-accent rounded-md">
                    <div>
                      <div className="text-sm text-muted-foreground">Percentage</div>
                      <div className={`text-xl font-bold ${
                        (reportCard.percentage ?? 0) >= 90 ? "text-green-600" :
                        (reportCard.percentage ?? 0) >= 75 ? "text-blue-600" :
                        (reportCard.percentage ?? 0) >= 60 ? "text-amber-600" :
                        "text-red-600"
                      }`}>
                        {reportCard.percentage ?? 0}%
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground">Grade</div>
                      <div className="text-xl font-bold">{reportCard.grade}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground">Rank</div>
                      <div className="text-xl font-bold">{reportCard.rank || "N/A"}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">Marks</div>
                      <div className="font-medium">{reportCard.averageMarks}/{reportCard.totalMarks}</div>
                    </div>
                    
                    <div>
                      <div className="text-muted-foreground">Attendance</div>
                      <div className="font-medium">{reportCard.attendance}%</div>
                    </div>
                    
                    <div className="col-span-2">
                      <div className="text-muted-foreground">Published</div>
                      <div className="font-medium">{reportCard.publishDate 
                        ? format(new Date(reportCard.publishDate), "MMM d, yyyy") 
                        : "Not published yet"}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <a href="#" target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </a>
                    </Button>
                    
                    <Button size="sm" className="flex-1" asChild>
                      <Link href={`/student/assessments/report-cards/${reportCard.id}`}>
                        View Details
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Report Cards Available</h3>
          <p className="text-muted-foreground max-w-sm">
            Your report cards will appear here once they are published
          </p>
        </div>
      )}
    </div>
  );
}
