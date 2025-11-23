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
    <div className="container p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Exam Results</h1>
          <p className="text-gray-500">
            View your exam results and performance analysis
          </p>
        </div>
        
        {totalResults > 0 && (
          <div className="flex items-center bg-blue-50 text-blue-800 px-4 py-2 rounded-md">
            <BarChart className="h-5 w-5 mr-2 text-blue-600" />
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
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>Your overall exam performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium text-gray-500 mb-1">Average Score</div>
                  <div className="text-2xl font-bold">{averagePercentage}%</div>
                </div>
                
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium text-gray-500 mb-1">Pass Rate</div>
                  <div className="text-2xl font-bold">{passingPercentage}%</div>
                  <div className="text-sm text-gray-500">{passingResults} of {totalResults} exams</div>
                </div>
                
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium text-gray-500 mb-1">Total Exams</div>
                  <div className="text-2xl font-bold">{totalResults}</div>
                </div>
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
                    <CardTitle>{term} Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Exam
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Subject
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Marks
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Percentage
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Details
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {termResults.map(result => (
                            <tr key={result.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium">{result.examTitle}</div>
                                <div className="text-sm text-gray-500">{result.examType}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {result.subject}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {format(new Date(result.examDate), "MMM d, yyyy")}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                {result.isAbsent ? (
                                  <Badge variant="outline" className="text-red-700 border-red-200">Absent</Badge>
                                ) : (
                                  <span>{result.marks}/{result.totalMarks}</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                {result.isAbsent ? (
                                  <span>-</span>
                                ) : (
                                  <Badge className={`${
                                    result.percentage >= 90 ? 'bg-green-100 text-green-800' :
                                    result.percentage >= 75 ? 'bg-blue-100 text-blue-800' :
                                    result.percentage >= 60 ? 'bg-amber-100 text-amber-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {result.percentage}%
                                  </Badge>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                {result.isAbsent ? (
                                  <Badge variant="destructive">Absent</Badge>
                                ) : result.isPassing ? (
                                  <Badge variant="outline" className="border-green-500 text-green-700">Pass</Badge>
                                ) : (
                                  <Badge variant="destructive">Fail</Badge>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <Button variant="ghost" className="text-blue-600" asChild>
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
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      ) : (
        <div className="text-center py-12">
          <FileCheck className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium">No Results Available</h3>
          <p className="mt-1 text-gray-500">
            Your exam results will appear here once they are published
          </p>
        </div>
      )}
    </div>
  );
}
