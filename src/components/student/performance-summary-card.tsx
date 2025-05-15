import { Award, BookOpen, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface PerformanceSummaryCardProps {
  overallPercentage: number;
  grade: string;
  totalExams: number;
  className: string;
}

export function PerformanceSummaryCard({
  overallPercentage,
  grade,
  totalExams,
  className
}: PerformanceSummaryCardProps) {
  // Get performance indicator color
  const getPerformanceColor = () => {
    if (overallPercentage >= 80) return "text-green-600";
    if (overallPercentage >= 60) return "text-blue-600";
    if (overallPercentage >= 40) return "text-amber-600";
    return "text-red-600";
  };

  // Get progress bar color
  const getProgressColor = () => {
    if (overallPercentage >= 80) return "bg-green-600";
    if (overallPercentage >= 60) return "bg-blue-600";
    if (overallPercentage >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  // Get grade indicator color
  const getGradeColor = () => {
    if (grade.startsWith("A")) return "bg-green-100 text-green-800";
    if (grade.startsWith("B")) return "bg-blue-100 text-blue-800";
    if (grade.startsWith("C")) return "bg-amber-100 text-amber-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overall Performance */}
          <div className="flex items-start gap-4">
            <div className="bg-slate-100 p-3 rounded-lg">
              <TrendingUp className="h-8 w-8 text-slate-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Overall Performance</h3>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${getPerformanceColor()}`}>
                  {overallPercentage.toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500">
                  based on {totalExams} assessments
                </span>
              </div>
              
              <div className="mt-3">
                <Progress 
                  value={overallPercentage} 
                  className={`h-2 [&>div]:${getProgressColor()}`} 
                />
              </div>
            </div>
          </div>
          
          {/* Current Grade */}
          <div className="flex items-start gap-4">
            <div className="bg-slate-100 p-3 rounded-lg">
              <Award className="h-8 w-8 text-slate-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Current Grade</h3>
              <div className="flex items-center gap-3">
                <span className={`text-3xl font-bold px-3 py-2 rounded-lg ${getGradeColor()}`}>
                  {grade}
                </span>
              </div>
              
              <p className="text-sm text-gray-500 mt-3">
                Based on your aggregate performance
              </p>
            </div>
          </div>
          
          {/* Class Information */}
          <div className="flex items-start gap-4">
            <div className="bg-slate-100 p-3 rounded-lg">
              <BookOpen className="h-8 w-8 text-slate-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Academic Information</h3>
              <p className="text-sm text-gray-500">Current Class</p>
              <p className="text-2xl font-medium">{className}</p>
              
              <p className="text-sm text-gray-500 mt-2">
                Academic Year: 2023-2024
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
