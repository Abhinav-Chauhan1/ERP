export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import Link from "next/link";
import { BarChart, FileCheck, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getExamResults } from "@/lib/actions/student-assessment-actions";
import { format } from "date-fns";
import { getPerformanceColor } from "@/lib/utils/grade-calculator";

export const metadata: Metadata = {
  title: "Exam Results | Student Portal",
  description: "View your exam results and academic performance",
};

export default async function ResultsPage() {
  const results = await getExamResults();

  // Group results by term
  const resultsByTerm = results.reduce((acc: Record<string, any[]>, result) => {
    const termKey = result.term;
    if (!acc[termKey]) {
      acc[termKey] = [];
    }
    acc[termKey].push(result);
    return acc;
  }, {});

  // Calculate overall performance metrics
  const totalResults = results.length;
  const passingResults = results.filter(r => r.isPassing).length;
  const passingPercentage = totalResults > 0
    ? Math.round((passingResults / totalResults) * 100)
    : 0;

  const averagePercentage = results.length > 0
    ? Math.round(
      results.reduce((sum, r) => sum + r.percentage, 0) / results.length
    )
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exam Results</h1>
          <p className="text-muted-foreground mt-1">
            View your exam results and performance analysis
          </p>
        </div>

        {totalResults > 0 && (
          <div className="flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-md">
            <BarChart className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">
              Overall: {averagePercentage}% ({passingResults}/{totalResults} passed)
            </span>
          </div>
        )}
      </div>

      {totalResults > 0 ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Performance Summary</CardTitle>
              <CardDescription>Your overall exam performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-blue-900 mb-1">Average Score</div>
                    <div className="text-3xl font-bold text-blue-900">{averagePercentage}%</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-green-900 mb-1">Pass Rate</div>
                    <div className="text-3xl font-bold text-green-900">{passingPercentage}%</div>
                    <div className="text-sm text-green-700 mt-1">{passingResults} of {totalResults} exams</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-purple-900 mb-1">Total Exams</div>
                    <div className="text-3xl font-bold text-purple-900">{totalResults}</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue={Object.keys(resultsByTerm)[0]} className="w-full">
            <TabsList className="mb-4 w-full md:w-auto grid grid-cols-2 md:flex md:flex-wrap">
              {Object.keys(resultsByTerm).map(term => (
                <TabsTrigger key={term} value={term}>
                  {term}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(resultsByTerm).map(([term, termResults]) => (
              <TabsContent key={term} value={term}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">{term} Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-accent border-b">
                              <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                                Exam
                              </th>
                              <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                                Subject
                              </th>
                              <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                                Date
                              </th>
                              <th className="py-3 px-4 text-center font-medium text-muted-foreground">
                                Marks
                              </th>
                              <th className="py-3 px-4 text-center font-medium text-muted-foreground">
                                Percentage
                              </th>
                              <th className="py-3 px-4 text-center font-medium text-muted-foreground">
                                Status
                              </th>
                              <th className="py-3 px-4 text-right font-medium text-muted-foreground">
                                Details
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {termResults.map(result => (
                              <tr key={result.id} className="border-b hover:bg-accent/50">
                                <td className="py-3 px-4 align-middle">
                                  <div className="font-medium">{result.examTitle}</div>
                                  <div className="text-sm text-muted-foreground">{result.examType}</div>
                                </td>
                                <td className="py-3 px-4 align-middle">
                                  {result.subject}
                                </td>
                                <td className="py-3 px-4 align-middle">
                                  {format(new Date(result.examDate), "MMM d, yyyy")}
                                </td>
                                <td className="py-3 px-4 align-middle text-center">
                                  {result.isAbsent ? (
                                    <Badge variant="outline" className="text-red-700 border-red-200">Absent</Badge>
                                  ) : (
                                    <span className="font-medium">{result.marks}/{result.totalMarks}</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 align-middle text-center">
                                  {result.isAbsent ? (
                                    <span>-</span>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      style={{
                                        backgroundColor: `${getPerformanceColor(result.percentage)}20`,
                                        color: getPerformanceColor(result.percentage),
                                        borderColor: `${getPerformanceColor(result.percentage)}40`
                                      }}
                                    >
                                      {result.percentage}%
                                    </Badge>
                                  )}
                                </td>
                                <td className="py-3 px-4 align-middle text-center">
                                  {result.isAbsent ? (
                                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Absent</Badge>
                                  ) : result.isPassing ? (
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Pass</Badge>
                                  ) : (
                                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Fail</Badge>
                                  )}
                                </td>
                                <td className="py-3 px-4 align-middle text-right">
                                  <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/student/assessments/results/${result.examId}`}>
                                      View
                                    </Link>
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <FileCheck className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Results Available</h3>
          <p className="text-muted-foreground max-w-sm">
            Your exam results will appear here once they are published
          </p>
        </div>
      )}
    </div>
  );
}
