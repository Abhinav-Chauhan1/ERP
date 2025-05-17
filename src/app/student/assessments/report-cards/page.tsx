import { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { Award, Download, FileText, BarChart2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getReportCards } from "@/lib/actions/student-assessment-actions";

export const metadata: Metadata = {
  title: "Report Cards | Student Portal",
  description: "View your term and annual report cards",
};

export default async function ReportCardsPage() {
  const reportCards = await getReportCards();
  
  return (
    <div className="container p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Report Cards</h1>
        <p className="text-gray-500">
          View your term and annual academic report cards
        </p>
      </div>
      
      {reportCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportCards.map(reportCard => (
            <Card key={reportCard.id} className="overflow-hidden">
              <div className="h-2 bg-blue-600"></div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center text-lg">
                    <Award className="h-5 w-5 mr-2 text-blue-600" />
                    {reportCard.term}
                  </CardTitle>
                  <Badge variant="outline">{reportCard.academicYear}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 bg-gray-50 rounded-md">
                    <div>
                      <div className="text-sm text-gray-500">Percentage</div>
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
                      <div className="text-sm text-gray-500">Grade</div>
                      <div className="text-xl font-bold">{reportCard.grade}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500">Rank</div>
                      <div className="text-xl font-bold">{reportCard.rank || "N/A"}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-gray-500">Marks</div>
                      <div>{reportCard.averageMarks}/{reportCard.totalMarks}</div>
                    </div>
                    
                    <div>
                      <div className="text-gray-500">Attendance</div>
                      <div>{reportCard.attendance}%</div>
                    </div>
                    
                    <div>
                      <div className="text-gray-500">Published</div>
                      <div>{reportCard.publishDate 
                        ? format(new Date(reportCard.publishDate), "MMM d, yyyy") 
                        : "Not published yet"}</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between pt-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href="#" target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </a>
                    </Button>
                    
                    <Button size="sm" asChild>
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
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium">No Report Cards Available</h3>
          <p className="mt-1 text-gray-500">
            Your report cards will appear here once they are published
          </p>
        </div>
      )}
    </div>
  );
}
