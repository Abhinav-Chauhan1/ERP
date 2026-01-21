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
import { getPerformanceColor } from "@/lib/utils/grade-calculator";

export const metadata: Metadata = {
  title: "Subject Analysis | Student Portal",
  description: "Detailed analysis of your performance in each subject",
};

export default async function SubjectAnalysisPage() {
  // Fetch required data
  const subjects = await getSubjectPerformance();
  const { subjectTrends } = await getPerformanceTrends();

  // Function to get badge style based on percentage (aligned with CBSE colors)
  const getBadgeStyle = (percentage: number) => {
    if (percentage >= 91) return "bg-green-100 text-green-800 border-green-200";
    if (percentage >= 71) return "bg-blue-100 text-blue-800 border-blue-200";
    if (percentage >= 51) return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subject Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Detailed analysis of your performance in each subject
        </p>
      </div>

      {/* Subject Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map(subject => (
          <Card key={subject.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-1" style={{ backgroundColor: getPerformanceColor(subject.percentage) }}></div>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <div className="p-2 bg-primary/10 rounded-md flex-shrink-0">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base truncate">{subject.name}</CardTitle>
                    <CardDescription className="text-xs">{subject.code}</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className={`${getBadgeStyle(subject.percentage)} flex-shrink-0`}>
                  {subject.grade}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Overall</div>
                  <div
                    className="text-2xl font-bold"
                    style={{ color: getPerformanceColor(subject.percentage) }}
                  >
                    {subject.percentage}%
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Exams</div>
                  <div className="text-2xl font-bold">
                    {subject.examsTaken}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Last Score</div>
                  {subject.lastScore !== null && subject.lastScoreTotal !== null ? (
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xl font-bold">
                        {Math.round((subject.lastScore / subject.lastScoreTotal) * 100)}%
                      </span>
                      {subject.lastScore / subject.lastScoreTotal >= 0.7 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  ) : (
                    <span className="text-lg text-muted-foreground">N/A</span>
                  )}
                </div>
              </div>

              {/* Term Progress */}
              {subjectTrends.find(st => st.id === subject.id)?.termData.some(t => t.percentage !== null) && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Term Progress</h4>
                  <div className="space-y-2.5">
                    {subjectTrends.find(st => st.id === subject.id)?.termData
                      .filter(td => td.percentage !== null)
                      .map((term, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{term.termName}</span>
                            <span className="font-medium">{term.percentage}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div
                              className="rounded-full h-1.5 transition-all"
                              style={{
                                width: `${term.percentage}%`,
                                backgroundColor: getPerformanceColor(term.percentage || 0)
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

      {/* Subject Comparison Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Subject Comparison</CardTitle>
          <CardDescription>
            Compare your performance across all subjects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subjects.map(subject => (
              <div key={subject.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: getPerformanceColor(subject.percentage) }}></div>
                    <span className="font-medium text-sm">{subject.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{subject.percentage}%</span>
                    <Badge variant="outline" className={getBadgeStyle(subject.percentage)}>{subject.grade}</Badge>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="rounded-full h-2 transition-all"
                    style={{
                      width: `${subject.percentage}%`,
                      backgroundColor: getPerformanceColor(subject.percentage)
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
