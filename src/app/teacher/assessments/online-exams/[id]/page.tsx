"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { getOnlineExamById } from "@/lib/actions/onlineExamActions";
import { ExamAnalytics } from "@/components/teacher/assessments/exam-analytics";

interface Question {
  id: string;
  question: string;
  questionType: string;
  marks: number;
  difficulty: string;
  topic?: string;
  options?: any;
  correctAnswer?: string;
}

interface Attempt {
  id: string;
  student: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  score?: number;
  startedAt: Date;
  submittedAt?: Date;
  status: string;
}

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
  instructions?: string;
  randomizeQuestions: boolean;
  allowReview: boolean;
  attempts: Attempt[];
}

export default function OnlineExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const [exam, setExam] = useState<OnlineExam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExam = async () => {
      setIsLoading(true);
      try {
        const result = await getOnlineExamById(examId);
        if (result.success && result.exam && result.questions) {
          setExam(result.exam as any);
          setQuestions(result.questions as any);
        } else {
          toast.error(result.error || "Failed to fetch exam details");
          router.push("/teacher/assessments/online-exams");
        }
      } catch (error) {
        console.error("Failed to fetch exam:", error);
        toast.error("An error occurred while fetching exam details");
        router.push("/teacher/assessments/online-exams");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExam();
  }, [examId, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!exam) {
    return null;
  }

  const getExamStatus = () => {
    const now = new Date();
    const start = new Date(exam.startTime);
    const end = new Date(exam.endTime);

    if (now < start) {
      return { label: "Upcoming", variant: "secondary" as const, icon: AlertCircle };
    } else if (now >= start && now <= end) {
      return { label: "Active", variant: "default" as const, icon: CheckCircle };
    } else {
      return { label: "Completed", variant: "outline" as const, icon: XCircle };
    }
  };

  const status = getExamStatus();
  const StatusIcon = status.icon;

  const completedAttempts = exam.attempts.filter(
    (a) => a.status === "GRADED" || a.status === "SUBMITTED" || a.status === "AUTO_SUBMITTED"
  );
  const inProgressAttempts = exam.attempts.filter(
    (a) => a.status === "IN_PROGRESS"
  );

  const averageScore =
    completedAttempts.length > 0
      ? completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) /
        completedAttempts.length
      : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/teacher/assessments/online-exams">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex justify-between items-center flex-1">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{exam.title}</h1>
            <p className="text-muted-foreground">
              {exam.subject.name} - {exam.class.name}
            </p>
          </div>
          <Badge variant={status.variant} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{exam.duration}</span>
              <span className="text-muted-foreground">minutes</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Marks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{exam.totalMarks}</span>
              <span className="text-muted-foreground">marks</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{questions.length}</span>
              <span className="text-muted-foreground">questions</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{exam.attempts.length}</span>
              <span className="text-muted-foreground">total</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="attempts">
            Attempts ({exam.attempts.length})
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exam Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Start Time
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(exam.startTime), "PPP 'at' p")}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    End Time
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(exam.endTime), "PPP 'at' p")}</span>
                  </div>
                </div>
              </div>

              {exam.instructions && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Instructions
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {exam.instructions}
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {exam.randomizeQuestions
                      ? "Questions Randomized"
                      : "Fixed Order"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {exam.allowReview
                      ? "Review Allowed"
                      : "No Review"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Completed Attempts
                  </div>
                  <div className="text-2xl font-bold">
                    {completedAttempts.length}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    In Progress
                  </div>
                  <div className="text-2xl font-bold">
                    {inProgressAttempts.length}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Average Score
                  </div>
                  <div className="text-2xl font-bold">
                    {averageScore.toFixed(1)} / {exam.totalMarks}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Questions ({questions.length})</CardTitle>
              <CardDescription>
                Questions included in this exam
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3 flex-1">
                        <span className="font-semibold text-muted-foreground">
                          {index + 1}.
                        </span>
                        <div className="flex-1">
                          <p className="font-medium">{question.question}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">
                              {question.questionType}
                            </Badge>
                            <Badge variant="outline">
                              {question.difficulty}
                            </Badge>
                            <Badge variant="outline">
                              {question.marks} marks
                            </Badge>
                            {question.topic && (
                              <Badge variant="outline">{question.topic}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attempts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Attempts</CardTitle>
              <CardDescription>
                View all student attempts for this exam
              </CardDescription>
            </CardHeader>
            <CardContent>
              {exam.attempts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No attempts yet
                </div>
              ) : (
                <div className="space-y-2">
                  {exam.attempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          {attempt.student.user.firstName}{" "}
                          {attempt.student.user.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Started: {format(new Date(attempt.startedAt), "PPp")}
                        </div>
                        {attempt.submittedAt && (
                          <div className="text-sm text-muted-foreground">
                            Submitted:{" "}
                            {format(new Date(attempt.submittedAt), "PPp")}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        {attempt.score !== null && attempt.score !== undefined ? (
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              {attempt.score}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              / {exam.totalMarks}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="secondary">{attempt.status}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {exam.attempts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  No analytics available yet. Analytics will be displayed once students complete the exam.
                </div>
              </CardContent>
            </Card>
          ) : (
            <ExamAnalytics examId={examId} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
