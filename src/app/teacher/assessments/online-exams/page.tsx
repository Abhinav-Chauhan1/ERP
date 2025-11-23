"use client";


import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock, Users, FileText } from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { getTeacherOnlineExams } from "@/lib/actions/onlineExamActions";

interface OnlineExam {
  id: string;
  title: string;
  subject: {
    name: string;
  };
  class: {
    name: string;
  };
  duration: number;
  totalMarks: number;
  startTime: Date;
  endTime: Date;
  attempts: Array<{
    id: string;
    status: string;
  }>;
  questions: string[];
}

export default function OnlineExamsPage() {
  const [exams, setExams] = useState<OnlineExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      setIsLoading(true);
      try {
        const result = await getTeacherOnlineExams();
        if (result.success && result.exams) {
          setExams(result.exams as any);
        } else {
          toast.error(result.error || "Failed to fetch online exams");
        }
      } catch (error) {
        console.error("Failed to fetch online exams:", error);
        toast.error("An error occurred while fetching online exams");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExams();
  }, []);

  const getExamStatus = (exam: OnlineExam) => {
    const now = new Date();
    const start = new Date(exam.startTime);
    const end = new Date(exam.endTime);

    if (now < start) {
      return { label: "Upcoming", variant: "secondary" as const };
    } else if (now >= start && now <= end) {
      return { label: "Active", variant: "default" as const };
    } else {
      return { label: "Completed", variant: "outline" as const };
    }
  };

  const getAttemptStats = (exam: OnlineExam) => {
    const total = exam.attempts.length;
    const completed = exam.attempts.filter(
      (a) => a.status === "GRADED" || a.status === "SUBMITTED" || a.status === "AUTO_SUBMITTED"
    ).length;
    const inProgress = exam.attempts.filter(
      (a) => a.status === "IN_PROGRESS"
    ).length;

    return { total, completed, inProgress };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Online Exams</h1>
          <p className="text-muted-foreground">
            Create and manage online examinations
          </p>
        </div>
        <Link href="/teacher/assessments/online-exams/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Online Exam
          </Button>
        </Link>
      </div>

      {exams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No online exams yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first online exam to get started
            </p>
            <Link href="/teacher/assessments/online-exams/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Online Exam
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => {
            const status = getExamStatus(exam);
            const stats = getAttemptStats(exam);

            return (
              <Link key={exam.id} href={`/teacher/assessments/online-exams/${exam.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">
                        {exam.title}
                      </CardTitle>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <FileText className="mr-2 h-4 w-4" />
                        {exam.subject.name} - {exam.class.name}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        {format(new Date(exam.startTime), "PPP")}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-2 h-4 w-4" />
                        {exam.duration} minutes • {exam.totalMarks} marks
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="mr-2 h-4 w-4" />
                        {stats.total} attempts ({stats.completed} completed,{" "}
                        {stats.inProgress} in progress)
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="text-sm text-muted-foreground">
                        {(exam.questions as string[]).length} questions
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

