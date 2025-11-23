export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { Metadata } from "next";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, TrendingUp, TrendingDown } from "lucide-react";
import { getSubjectPerformance, getPerformanceTrends } from "@/lib/actions/student-performance-actions";

export const metadata: Metadata = {
  title: "Subject Analysis | Student Portal",
  description: "Detailed analysis of your performance in each subject",
};

export default async function SubjectAnalysisPage() {
  // Fetch required data
  const subjects = await getSubjectPerformance();
  const { subjectTrends } = await getPerformanceTrends();
  
  // Function to get color based on percentage
  const getColor = (percentage: number) => {
    if (percentage >= 90) return "#22c55e"; // green
    if (percentage >= 75) return "#3b82f6"; // blue
    if (percentage >= 60) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  // Function to get badge style based on percentage
  const getBadgeStyle = (percentage: number) => {
    if (percentage >= 90) return "bg-green-100 text-green-800 border-green-200";
    if (percentage >= 75) return "bg-blue-100 text-blue-800 border-blue-200";
    if (percentage >= 60) return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-red-100 text-red-800 border-red-200";
  };
  
  return (
    <div className="container p-6">
      <h1 className="text-2xl font-bold mb-6">Subject Analysis</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {subjects.map(subject => (
          <Card key={subject.id} className="overflow-hidden">
            <div className="h-2" style={{ backgroundColor: getColor(subject.percentage) }}></div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                    {subject.name}
                  </CardTitle>
                  <CardDescription>{subject.code}</CardDescription>
                </div>
                <Badge variant="outline" className={getBadgeStyle(subject.percentage)}>
                  Grade {subject.grade}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-1">Overall</div>
                  <div 
                    className="text-3xl font-bold" 
                    style={{ color: getColor(subject.percentage) }}
                  >
                    {subject.percentage}%
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-1">Exams Taken</div>
                  <div className="text-3xl font-bold text-gray-800">
                    {subject.examsTaken}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-1">Last Score</div>
                  {subject.lastScore !== null && subject.lastScoreTotal !== null ? (
                    <div className="flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-800">
                        {Math.round((subject.lastScore / subject.lastScoreTotal) * 100)}%
                      </span>
                      {subject.lastScore / subject.lastScoreTotal >= 0.7 ? (
                        <TrendingUp className="h-5 w-5 ml-1 text-green-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 ml-1 text-red-500" />
                      )}
                    </div>
                  ) : (
                    <span className="text-xl text-gray-500">N/A</span>
                  )}
                </div>
              </div>
              
              {/* Simple visual bar chart instead of using recharts */}
              {subjectTrends.find(st => st.id === subject.id)?.termData.some(t => t.percentage !== null) && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-2">Term Progress</h4>
                  <div className="space-y-2">
                    {subjectTrends.find(st => st.id === subject.id)?.termData
                      .filter(td => td.percentage !== null)
                      .map((term, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{term.termName}</span>
                            <span className="font-medium">{term.percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="rounded-full h-1.5" 
                              style={{ 
                                width: `${term.percentage}%`,
                                backgroundColor: getColor(term.percentage || 0)
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Subject Comparison</CardTitle>
          <CardDescription>
            Compare your performance across all subjects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subjects.map(subject => (
              <div key={subject.id} className="space-y-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: getColor(subject.percentage) }}></div>
                    <span className="font-medium">{subject.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium">{subject.percentage}%</span>
                    <Badge className="ml-2" variant="outline">{subject.grade}</Badge>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="rounded-full h-2.5" 
                    style={{ 
                      width: `${subject.percentage}%`,
                      backgroundColor: getColor(subject.percentage)
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
