"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  getExamAttempt,
  saveAnswer,
  submitExamAttempt,
} from "@/lib/actions/studentExamActions";

interface Question {
  id: string;
  question: string;
  questionType: string;
  options?: any;
  marks: number;
}

interface ExamAttempt {
  id: string;
  answers: Record<string, any>;
  exam: {
    title: string;
    duration: number;
    totalMarks: number;
    instructions?: string;
    allowReview: boolean;
    subject: {
      name: string;
    };
  };
}

export default function TakeExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownWarning = useRef(false);

  // Load exam data
  useEffect(() => {
    loadExam();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [examId]);

  // Disable copy-paste functionality
  useEffect(() => {
    const preventCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.error("Copy-paste is disabled during the exam");
    };

    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.error("Right-click is disabled during the exam");
    };

    document.addEventListener("copy", preventCopyPaste);
    document.addEventListener("paste", preventCopyPaste);
    document.addEventListener("cut", preventCopyPaste);
    document.addEventListener("contextmenu", preventContextMenu);

    return () => {
      document.removeEventListener("copy", preventCopyPaste);
      document.removeEventListener("paste", preventCopyPaste);
      document.removeEventListener("cut", preventCopyPaste);
      document.removeEventListener("contextmenu", preventContextMenu);
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1000;

          // Show warning at 5 minutes
          if (newTime <= 5 * 60 * 1000 && !hasShownWarning.current) {
            hasShownWarning.current = true;
            setShowTimeWarning(true);
            toast.error("Only 5 minutes remaining!");
          }

          // Auto-submit when time expires
          if (newTime <= 0) {
            handleAutoSubmit();
            return 0;
          }

          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeRemaining]);

  const loadExam = async () => {
    try {
      const result = await getExamAttempt(examId);
      if (result.success && result.attempt && result.questions) {
        setAttempt(result.attempt as any);
        setQuestions(result.questions);
        setAnswers((result.attempt.answers as Record<string, any>) || {});
        setTimeRemaining(result.timeRemaining || 0);
      } else {
        toast.error(result.error || "Failed to load exam");
        router.push("/student/assessments/exams/online");
      }
    } catch (error) {
      toast.error("Failed to load exam");
      router.push("/student/assessments/exams/online");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));

    // Auto-save after 2 seconds of inactivity
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      saveAnswerToServer(questionId, answer);
    }, 2000);
  };

  const saveAnswerToServer = async (questionId: string, answer: any) => {
    setIsSaving(true);
    try {
      await saveAnswer(examId, questionId, answer);
    } catch (error) {
      console.error("Failed to save answer:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    toast.error("Time's up! Submitting your exam...");

    try {
      const result = await submitExamAttempt(examId, answers);
      if (result.success) {
        toast.success("Exam submitted successfully!");
        router.push(`/student/assessments/exams/online/${examId}/result`);
      } else {
        toast.error(result.error || "Failed to submit exam");
      }
    } catch (error) {
      toast.error("Failed to submit exam");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setShowSubmitDialog(false);
    setIsSubmitting(true);

    try {
      const result = await submitExamAttempt(examId, answers);
      if (result.success) {
        toast.success("Exam submitted successfully!");
        router.push(`/student/assessments/exams/online/${examId}/result`);
      } else {
        toast.error(result.error || "Failed to submit exam");
      }
    } catch (error) {
      toast.error("Failed to submit exam");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).filter((key) => {
      const answer = answers[key];
      return answer !== null && answer !== undefined && answer !== "";
    }).length;
  };

  const renderQuestion = (question: Question) => {
    const currentAnswer = answers[question.id];

    if (question.questionType === "MCQ") {
      const options = question.options as { [key: string]: string };
      return (
        <div className="space-y-4">
          <RadioGroup
            value={currentAnswer || ""}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
          >
            {Object.entries(options).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value={key} id={`${question.id}-${key}`} />
                <Label
                  htmlFor={`${question.id}-${key}`}
                  className="flex-1 cursor-pointer"
                >
                  <span className="font-medium mr-2">{key}.</span>
                  {value}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );
    }

    if (question.questionType === "TRUE_FALSE") {
      return (
        <div className="space-y-4">
          <RadioGroup
            value={currentAnswer || ""}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
          >
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
              <RadioGroupItem value="TRUE" id={`${question.id}-true`} />
              <Label
                htmlFor={`${question.id}-true`}
                className="flex-1 cursor-pointer"
              >
                True
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
              <RadioGroupItem value="FALSE" id={`${question.id}-false`} />
              <Label
                htmlFor={`${question.id}-false`}
                className="flex-1 cursor-pointer"
              >
                False
              </Label>
            </div>
          </RadioGroup>
        </div>
      );
    }

    if (question.questionType === "ESSAY") {
      return (
        <Textarea
          value={currentAnswer || ""}
          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
          placeholder="Type your answer here..."
          className="min-h-[200px]"
          onCopy={(e) => e.preventDefault()}
          onPaste={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
        />
      );
    }

    return null;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading exam...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!attempt || questions.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Exam Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The exam you're looking for could not be found.
              </p>
              <Button onClick={() => router.push("/student/assessments/exams/online")}>
                Back to Exams
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = getAnsweredCount();
  const isTimeWarning = timeRemaining <= 5 * 60 * 1000;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header with timer */}
      <Card className="mb-6 sticky top-0 z-10 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{attempt.exam.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {attempt.exam.subject.name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Time Remaining</p>
                <div
                  className={`text-2xl font-bold flex items-center gap-2 ${
                    isTimeWarning ? "text-destructive" : "text-primary"
                  }`}
                >
                  <Clock className="h-5 w-5" />
                  {formatTime(timeRemaining)}
                </div>
              </div>
              {isSaving && (
                <Badge variant="secondary" className="animate-pulse">
                  Saving...
                </Badge>
              )}
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span>
                Answered: {answeredCount} / {questions.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Question Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Badge variant="outline" className="mb-2">
                {currentQuestion.questionType.replace("_", " ")}
              </Badge>
              <CardTitle className="text-lg leading-relaxed">
                {currentQuestion.question}
              </CardTitle>
            </div>
            <Badge variant="secondary">{currentQuestion.marks} marks</Badge>
          </div>
        </CardHeader>
        <CardContent>{renderQuestion(currentQuestion)}</CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>

            <div className="flex gap-2 flex-wrap justify-center">
              {questions.map((_, index) => {
                const isAnswered = answers[questions[index].id] !== undefined &&
                  answers[questions[index].id] !== null &&
                  answers[questions[index].id] !== "";
                const isCurrent = index === currentQuestionIndex;

                return (
                  <Button
                    key={index}
                    variant={isCurrent ? "default" : isAnswered ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setCurrentQuestionIndex(index)}
                    className="w-10 h-10"
                  >
                    {isAnswered && !isCurrent && (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    {!isAnswered && !isCurrent && index + 1}
                    {isCurrent && index + 1}
                  </Button>
                );
              })}
            </div>

            {currentQuestionIndex < questions.length - 1 ? (
              <Button
                onClick={() =>
                  setCurrentQuestionIndex((prev) =>
                    Math.min(questions.length - 1, prev + 1)
                  )
                }
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={() => setShowSubmitDialog(true)}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? "Submitting..." : "Submit Exam"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} out of {questions.length} questions.
              {answeredCount < questions.length && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: You have {questions.length - answeredCount} unanswered
                  questions.
                </span>
              )}
              <span className="block mt-2">
                Once submitted, you cannot change your answers. Are you sure you want
                to submit?
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review Answers</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              Yes, Submit Exam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Time Warning Dialog */}
      <AlertDialog open={showTimeWarning} onOpenChange={setShowTimeWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Time Warning
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have only 5 minutes remaining to complete the exam. The exam will be
              automatically submitted when time expires.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
