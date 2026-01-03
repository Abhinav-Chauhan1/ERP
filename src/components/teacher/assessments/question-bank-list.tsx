"use client";

import { useState, useEffect, useCallback } from "react";
import { getTeacherQuestions, deleteQuestion } from "@/lib/actions/questionBankActions";
import { getTeacherSubjectsForExam } from "@/lib/actions/onlineExamActions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, Search } from "lucide-react";
import Link from "next/link";
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
import { toast } from "react-hot-toast";

type Question = {
  id: string;
  question: string;
  questionType: string;
  marks: number;
  difficulty: string;
  topic: string | null;
  usageCount: number;
  subject: {
    id: string;
    name: string;
  };
};

export function QuestionBankList() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filters
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const [questionsResult, subjectsResult] = await Promise.all([
        getTeacherQuestions(),
        getTeacherSubjectsForExam(),
      ]);

      if (questionsResult.success && questionsResult.questions) {
        setQuestions(questionsResult.questions);
      }

      if (subjectsResult.success && subjectsResult.subjects) {
        setSubjects(subjectsResult.subjects);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const applyFilters = useCallback(function () {
    let filtered = [...questions];

    if (subjectFilter !== "all") {
      filtered = filtered.filter((q) => q.subject.id === subjectFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((q) => q.questionType === typeFilter);
    }

    if (difficultyFilter !== "all") {
      filtered = filtered.filter((q) => q.difficulty === difficultyFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter((q) =>
        q.question.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredQuestions(filtered);
  }, [questions, subjectFilter, typeFilter, difficultyFilter, searchQuery]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  async function handleDelete(id: string) {
    try {
      const result = await deleteQuestion(id);
      if (result.success) {
        toast.success("Question deleted successfully");
        setQuestions(questions.filter((q) => q.id !== id));
      } else {
        toast.error(result.error || "Failed to delete question");
      }
    } catch (error) {
      toast.error("Failed to delete question");
    }
    setDeleteId(null);
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="MCQ">Multiple Choice</SelectItem>
            <SelectItem value="TRUE_FALSE">True/False</SelectItem>
            <SelectItem value="ESSAY">Essay</SelectItem>
          </SelectContent>
        </Select>

        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All Difficulties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Difficulties</SelectItem>
            <SelectItem value="EASY">Easy</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HARD">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredQuestions.length} of {questions.length} questions
      </div>

      {/* Questions list */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No questions found. Try adjusting your filters or create a new question.
          </div>
        ) : (
          filteredQuestions.map((question) => (
            <div
              key={question.id}
              className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="font-medium line-clamp-2">{question.question}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline">{question.subject.name}</Badge>
                      <Badge variant="secondary">
                        {question.questionType === "MCQ"
                          ? "Multiple Choice"
                          : question.questionType === "TRUE_FALSE"
                            ? "True/False"
                            : "Essay"}
                      </Badge>
                      <Badge
                        variant={
                          question.difficulty === "EASY"
                            ? "default"
                            : question.difficulty === "HARD"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {question.difficulty}
                      </Badge>
                      {question.topic && (
                        <Badge variant="outline">{question.topic}</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {question.marks} marks
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Used {question.usageCount} times
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Link href={`/teacher/assessments/question-bank/${question.id}/edit`}>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteId(question.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              question from your question bank.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
