"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Assignment {
  id: string;
  title: string;
  dueDate: Date;
  subject: {
    name: string;
  };
  submissions: Array<{
    id: string;
    submittedAt: Date;
  }>;
}

interface AssignmentCompletionChartProps {
  assignments: Assignment[];
}

export function AssignmentCompletionChart({ assignments }: AssignmentCompletionChartProps) {
  if (assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Assignment Completion
          </CardTitle>
          <CardDescription>No assignments available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No assignments to display
          </p>
        </CardContent>
      </Card>
    );
  }

  // Categorize assignments
  const now = new Date();
  const completed = assignments.filter(a => a.submissions.length > 0);
  const pending = assignments.filter(a => 
    a.submissions.length === 0 && new Date(a.dueDate) > now
  );
  const overdue = assignments.filter(a => 
    a.submissions.length === 0 && new Date(a.dueDate) <= now
  );

  const completionRate = (completed.length / assignments.length) * 100;

  // Group by subject
  const subjectStats = assignments.reduce((acc, assignment) => {
    const subjectName = assignment.subject.name;
    if (!acc[subjectName]) {
      acc[subjectName] = {
        total: 0,
        completed: 0
      };
    }
    acc[subjectName].total++;
    if (assignment.submissions.length > 0) {
      acc[subjectName].completed++;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  const subjectData = Object.entries(subjectStats).map(([name, stats]) => ({
    name,
    total: stats.total,
    completed: stats.completed,
    percentage: (stats.completed / stats.total) * 100
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Assignment Completion
            </CardTitle>
            <CardDescription>{assignments.length} total assignments</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{completionRate.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Completion Rate</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-2">
            <Progress value={completionRate} className="h-3" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                  <span className="text-xs text-muted-foreground">Completed</span>
                </div>
                <p className="text-xl font-bold text-green-600 dark:text-green-500">
                  {completed.length}
                </p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-3">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                  <span className="text-xs text-muted-foreground">Pending</span>
                </div>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-500">
                  {pending.length}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-950 rounded-lg p-3">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
                  <span className="text-xs text-muted-foreground">Overdue</span>
                </div>
                <p className="text-xl font-bold text-red-600 dark:text-red-500">
                  {overdue.length}
                </p>
              </div>
            </div>
          </div>

          {/* Subject-wise Breakdown */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium">By Subject</h4>
            {subjectData.map((subject) => (
              <div key={subject.name} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{subject.name}</span>
                  <span className="font-medium">
                    {subject.completed}/{subject.total}
                  </span>
                </div>
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full ${
                      subject.percentage >= 80 ? "bg-green-500" :
                      subject.percentage >= 60 ? "bg-primary" :
                      subject.percentage >= 40 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${subject.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
