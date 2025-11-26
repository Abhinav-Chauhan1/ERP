export const dynamic = 'force-dynamic';

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
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Academic Performance</h1>
        <p className="text-muted-foreground mt-1">
          View and analyze your academic progress and achievements
        </p>
      </div>
      
      {/* Performance Summary Card with Gradient */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Current Performance Status</h2>
              <p className="text-blue-100">Overall Grade: <span className="font-bold text-white">{summary.grade}</span></p>
            </div>
            
            <div className="flex gap-4">
              <div className="flex flex-col items-center bg-white/10 backdrop-blur-sm px-6 py-4 rounded-lg border border-white/20">
                <span className="text-blue-100 text-sm mb-1">Overall Percentage</span>
                <span className="text-3xl font-bold">{summary.overallPercentage}%</span>
              </div>
              
              {summary.rank && (
                <div className="flex flex-col items-center bg-white/10 backdrop-blur-sm px-6 py-4 rounded-lg border border-white/20">
                  <span className="text-blue-100 text-sm mb-1">Class Rank</span>
                  <span className="text-3xl font-bold">{summary.rank}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Navigation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {performanceLinks.map((link) => (
          <Card key={link.href} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${link.color}`}>
                  <link.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{link.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">{link.description}</p>
              <Button asChild className="w-full min-h-[44px]">
                <Link href={link.href}>
                  View Details
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
