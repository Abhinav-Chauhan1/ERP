"use client";


import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3, DollarSign, Users, TrendingUp,
  FileText, Download, Calendar, ArrowRight, GitCompare
} from "lucide-react";

export default function ReportsPage() {
  const reportCategories = [
    {
      title: "Academic Reports",
      description: "Student performance, grades, and academic analytics",
      icon: BarChart3,
      color: "bg-primary",
      href: "/admin/reports/academic",
      reports: [
        "Student Performance Reports",
        "Grade Distribution Analysis",
        "Subject-wise Performance",
        "Class Rankings"
      ]
    },
    {
      title: "Financial Reports",
      description: "Fee collection, expenses, and financial summaries",
      icon: DollarSign,
      color: "bg-green-500",
      href: "/admin/reports/financial",
      reports: [
        "Fee Collection Reports",
        "Outstanding Payments",
        "Expense Analysis",
        "Budget vs Actual"
      ]
    },
    {
      title: "Attendance Reports",
      description: "Student and staff attendance tracking and analysis",
      icon: Users,
      color: "bg-purple-500",
      href: "/admin/reports/attendance",
      reports: [
        "Daily Attendance Summary",
        "Monthly Attendance Trends",
        "Absenteeism Analysis",
        "Class-wise Attendance"
      ]
    },
    {
      title: "Performance Analytics",
      description: "Comprehensive analytics and insights",
      icon: TrendingUp,
      color: "bg-orange-500",
      href: "/admin/reports/performance",
      reports: [
        "Overall School Performance",
        "Teacher Performance Metrics",
        "Student Progress Tracking",
        "Comparative Analysis"
      ]
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Generate comprehensive reports and analyze institutional data
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {reportCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Card key={category.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`${category.color} p-3 rounded-lg text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle>{category.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {category.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {category.reports.map((report) => (
                    <li key={report} className="flex items-center text-sm text-muted-foreground">
                      <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                      {report}
                    </li>
                  ))}
                </ul>
                <Link href={category.href}>
                  <Button className="w-full">
                    View Reports
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common reporting tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Button variant="outline" className="justify-start">
              <Download className="mr-2 h-4 w-4" />
              Export All Data
            </Button>
            <Link href="/admin/reports/scheduled">
              <Button variant="outline" className="justify-start w-full">
                <Calendar className="mr-2 h-4 w-4" />
                Scheduled Reports
              </Button>
            </Link>
            <Link href="/admin/reports/builder">
              <Button variant="outline" className="justify-start w-full">
                <FileText className="mr-2 h-4 w-4" />
                Custom Report Builder
              </Button>
            </Link>
            <Link href="/admin/reports/comparative">
              <Button variant="outline" className="justify-start w-full">
                <GitCompare className="mr-2 h-4 w-4" />
                Comparative Analysis
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

