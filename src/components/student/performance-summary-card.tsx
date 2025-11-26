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
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overall Performance */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/10 backdrop-blur-sm p-3 border border-white/20">
                <BarChart2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-100">Overall Performance</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold">{overallPercentage}%</span>
                  <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/20">
                    Grade {grade}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${overallPercentage}%` }}
              ></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-white/10 backdrop-blur-sm p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-blue-100" />
                  <span className="text-sm text-blue-100">Total Exams</span>
                </div>
                <div className="text-2xl font-bold">{totalExams}</div>
              </div>
              
              <div className="rounded-lg bg-white/10 backdrop-blur-sm p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-100" />
                  <span className="text-sm text-blue-100">Class</span>
                </div>
                <div className="text-2xl font-bold">{className}</div>
              </div>
            </div>
          </div>
          
          {/* Class Rank */}
          <div className="flex flex-col justify-center items-center text-center bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="rounded-full bg-amber-500/20 p-3 mb-3">
              <Award className="h-8 w-8 text-amber-300" />
            </div>
            <div className="text-sm text-blue-100 mb-2">Class Rank</div>
            {rank ? (
              <>
                <div className="text-4xl font-bold mb-1">{rank}</div>
                <div className="text-sm text-blue-100">Great achievement!</div>
              </>
            ) : (
              <>
                <div className="text-xl font-medium mb-1">Not Available</div>
                <div className="text-sm text-blue-100">
                  Rank will be updated after result finalization
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
