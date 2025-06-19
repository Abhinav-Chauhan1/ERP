import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Award, BarChart2, BookOpen, TrendingUp } from "lucide-react";

interface PerformanceSummaryCardProps {
  overallPercentage: number;
  grade: string;
  totalExams: number;
  className: string;
  rank?: number | null;
}

export function PerformanceSummaryCard({
  overallPercentage,
  grade,
  totalExams,
  className,
  rank
}: PerformanceSummaryCardProps) {
  // Get color based on grade
  const getGradeColor = (grade: string) => {
    const firstChar = grade.charAt(0);
    if (firstChar === 'A') return "text-green-600";
    if (firstChar === 'B') return "text-blue-600";
    if (firstChar === 'C') return "text-amber-600";
    if (firstChar === 'D') return "text-orange-600";
    return "text-red-600";
  };
  
  // Get progress color based on percentage
  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-600";
    if (percentage >= 75) return "bg-blue-600";
    if (percentage >= 60) return "bg-amber-600";
    if (percentage >= 50) return "bg-orange-600";
    return "bg-red-600";
  };

  return (
    <Card className="overflow-hidden">
      <div className="h-2 bg-blue-600"></div>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-50 p-3">
                <BarChart2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-500">Overall Performance</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{overallPercentage}%</span>
                  <Badge 
                    className={`${getGradeColor(grade)} bg-opacity-10 border-current`}
                  >
                    Grade {grade}
                  </Badge>
                </div>
              </div>
            </div>
            
            <Progress 
              value={overallPercentage} 
              className="h-2"
              style={{ 
                "--progress-background": "rgba(0,0,0,0.1)",
                "--progress-foreground": getProgressColor(overallPercentage)
              } as React.CSSProperties}
            />
            
            <div className="pt-2 grid grid-cols-2 gap-4">
              <div className="rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Total Exams</span>
                </div>
                <div className="mt-1 text-lg font-semibold">{totalExams}</div>
              </div>
              
              <div className="rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Class</span>
                </div>
                <div className="mt-1 text-lg font-semibold">{className}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 flex flex-col justify-center items-center">
            <div className="text-center">
              <div className="rounded-full bg-amber-50 p-3 inline-flex mx-auto mb-3">
                <Award className="h-8 w-8 text-amber-600" />
              </div>
              <div className="text-sm text-gray-500 mb-1">Class Rank</div>
              {rank ? (
                <>
                  <div className="text-4xl font-bold text-amber-600">{rank}</div>
                  <div className="text-gray-500 mt-1">Great achievement!</div>
                </>
              ) : (
                <>
                  <div className="text-xl font-medium text-gray-600 mt-2">Not Available</div>
                  <div className="text-gray-500 mt-1 text-sm">
                    Rank will be updated after result finalization
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
