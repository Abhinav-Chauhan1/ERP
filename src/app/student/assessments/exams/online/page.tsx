"use client";


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { getAvailableExamsForStudent, startExamAttempt } from "@/lib/actions/studentExamActions";
import { toast } from "react-hot-toast";

interface OnlineExam {
  id: string;
  title: string;
  duration: number;
  totalMarks: number;
  startTime: Date;
  endTime: Date;
  instructions?: string;
  subject: {
    name: string;
  };
  attempts: Array<{
    id: string;
    status: string;
  }>;
}

export default function StudentOnlineExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<OnlineExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startingExam, setStartingExam] = useState<string | null>(null);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const result = await getAvailableExamsForStudent();
      if (result.success && result.exams) {
        setExams(result.exams as any);
      } else {
        toast.error(result.error || "Failed to load exams");
      }
    } catch (error) {
      toast.error("Failed to load exams");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartExam = async (examId: string) => {
    setStartingExam(examId);
    try {
      const result = await startExamAttempt(examId);
      if (result.success) {
        toast.success("Exam started!");
        router.push(`/student/assessments/exams/online/${examId}/take`);
      } else {
        toast.error(result.error || "Failed to start exam");
      }
    } catch (error) {
      toast.error("Failed to start exam");
    } finally {
      setStartingExam(null);
    }
  };

  const getExamStatus = (exam: OnlineExam) => {
    if (exam.attempts.length > 0) {
      const attempt = exam.attempts[0];
      if (attempt.status === "SUBMITTED") {
        return { label: "Completed", variant: "default" as const, icon: CheckCircle };
      } else {
        return { label: "In Progress", variant: "secondary" as const, icon: AlertCircle };
      }
    }
    return { label: "Not Started", variant: "outline" as const, icon: Clock };
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Online Exams</h1>
          <p className="text-muted-foreground">Loading available exams...</p>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Online Exams</h1>
        <p className="text-muted-foreground">
          View and take your scheduled online exams
        </p>
      </div>

      {exams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Exams Available</h3>
            <p className="text-muted-foreground text-center">
              There are no online exams scheduled at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {exams.map((exam) => {
            const status = getExamStatus(exam);
            const StatusIcon = status.icon;
            const hasAttempt = exam.attempts.length > 0;
            const isInProgress = hasAttempt && exam.attempts[0].status === "IN_PROGRESS";

            return (
              <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{exam.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        {exam.subject.name}
                      </CardDescription>
                    </div>
                    <Badge variant={status.variant} className="flex items-center gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Duration: {exam.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span>Total Marks: {exam.totalMarks}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Ends: {format(new Date(exam.endTime), "MMM dd, yyyy HH:mm")}
                      </span>
                    </div>
                  </div>

                  {exam.instructions && (
                    <div className="mb-4 p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium mb-1">Instructions:</p>
                      <p className="text-sm text-muted-foreground">{exam.instructions}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!hasAttempt && (
                      <Button
                        onClick={() => handleStartExam(exam.id)}
                        disabled={startingExam === exam.id}
                        className="flex-1"
                      >
                        {startingExam === exam.id ? "Starting..." : "Start Exam"}
                      </Button>
                    )}
                    {isInProgress && (
                      <Button
                        onClick={() => router.push(`/student/assessments/exams/online/${exam.id}/take`)}
                        className="flex-1"
                      >
                        Continue Exam
                      </Button>
                    )}
                    {hasAttempt && exam.attempts[0].status === "SUBMITTED" && (
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/student/assessments/exams/online/${exam.id}/result`)}
                        className="flex-1"
                      >
                        View Result
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

