import { redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { 
  BarChart2, 
  TrendingUp, 
  Award, 
  BookOpen, 
  ChevronRight 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPerformanceSummary } from "@/lib/actions/student-performance-actions";

export const metadata: Metadata = {
  title: "Academic Performance | Student Portal",
  description: "View your academic performance statistics and analysis",
};

export default async function PerformancePage() {
  // Get summary data
  const summary = await getPerformanceSummary();
  
  const performanceLinks = [
    {
      title: "Performance Overview",
      description: "View your overall academic performance statistics",
      icon: BarChart2,
      href: "/student/performance/overview",
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Subject Analysis",
      description: "Analyze your performance in each subject",
      icon: BookOpen,
      href: "/student/performance/subjects",
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Performance Trends",
      description: "See how your performance has changed over time",
      icon: TrendingUp,
      href: "/student/performance/trends",
      color: "bg-amber-50 text-amber-600",
    },
    {
      title: "Class Rank",
      description: "View your class rank and percentile standing",
      icon: Award,
      href: "/student/performance/rank",
      color: "bg-purple-50 text-purple-600",
    },
  ];
  
  return (
    <div className="container p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Academic Performance</h1>
        <p className="text-gray-500">
          View and analyze your academic progress and achievements
        </p>
      </div>
      
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Current Performance Status</h2>
            <p className="text-gray-600">Overall Grade: <span className="font-bold">{summary.grade}</span></p>
          </div>
          
          <div className="flex flex-col items-center bg-white px-6 py-3 rounded-lg shadow-sm">
            <span className="text-gray-500 text-sm">Overall Percentage</span>
            <span className="text-3xl font-bold text-blue-600">{summary.overallPercentage}%</span>
          </div>
          
          {summary.rank && (
            <div className="flex flex-col items-center bg-white px-6 py-3 rounded-lg shadow-sm">
              <span className="text-gray-500 text-sm">Class Rank</span>
              <span className="text-3xl font-bold text-amber-600">{summary.rank}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {performanceLinks.map((link) => (
          <Card key={link.href}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <div className={`rounded-lg p-2 mr-3 ${link.color}`}>
                  <link.icon className="h-6 w-6" />
                </div>
                {link.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">{link.description}</p>
              <Button asChild className="w-full mt-2">
                <Link href={link.href}>
                  Access {link.title}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
