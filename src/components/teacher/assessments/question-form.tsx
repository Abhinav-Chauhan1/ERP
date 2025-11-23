"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createQuestion, updateQuestion } from "@/lib/actions/questionBankActions";
import { getTeacherSubjectsForExam } from "@/lib/actions/onlineExamActions";
import { toast } from "react-hot-toast";
import { Plus, X } from "lucide-react";
import { QuestionType, Difficulty } from "@prisma/client";

type QuestionFormProps = {
  question?: any;
};

export function QuestionForm({ question }: QuestionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Form state
  const [questionText, setQuestionText] = useState(question?.question || "");
  const [questionType, setQuestionType] = useState<QuestionType>(
    question?.questionType || "MCQ"
  );
  const [options, setOptions] = useState<string[]>(
    question?.options || ["", "", "", ""]
  );
  const [correctAnswer, setCorrectAnswer] = useState(
    question?.correctAnswer || ""
  );
  const [marks, setMarks] = useState(question?.marks?.toString() || "1");
  const [subjectId, setSubjectId] = useState(question?.subjectId || "");
  const [topic, setTopic] = useState(question?.topic || "");
  const [difficulty, setDifficulty] = useState<Difficulty>(
    question?.difficulty || "MEDIUM"
  );

  useEffect(() => {
    loadSubjects();
  }, []);

  async function loadSubjects() {
    const result = await getTeacherSubjectsForExam();
    if (result.success && result.subjects) {
      setSubjects(result.subjects);
      if (!question && result.subjects.length > 0) {
        setSubjectId(result.subjects[0].id);
      }
    }
  }

  function addOption() {
    setOptions([...options, ""]);
  }

  function removeOption(index: number) {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  }

  function updateOption(index: number, value: string) {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!questionText.trim()) {
        toast.error("Question text is required");
        setLoading(false);
        return;
      }

      if (!subjectId) {
        toast.error("Please select a subject");
        setLoading(false);
        return;
      }

      const marksNum = parseFloat(marks);
      if (isNaN(marksNum) || marksNum <= 0) {
        toast.error("Marks must be a positive number");
        setLoading(false);
        return;
      }

      // Type-specific validation
      if (questionType === "MCQ") {
        const validOptions = options.filter((o) => o.trim());
        if (validOptions.length < 2) {
          toast.error("MCQ questions must have at least 2 options");
          setLoading(false);
          return;
        }
        if (!correctAnswer.trim()) {
          toast.error("Please specify the correct answer");
          setLoading(false);
          return;
        }
      }

      if (questionType === "TRUE_FALSE") {
        if (!["TRUE", "FALSE"].includes(correctAnswer)) {
          toast.error("Please select TRUE or FALSE as the correct answer");
          setLoading(false);
          return;
        }
      }

      const data = {
        question: questionText,
        questionType,
        options: questionType === "MCQ" ? options.filter((o) => o.trim()) : undefined,
        correctAnswer:
          questionType === "ESSAY" ? undefined : correctAnswer,
        marks: marksNum,
        subjectId,
        topic: topic.trim() || undefined,
        difficulty,
      };

      let result;
      if (question) {
        result = await updateQuestion(question.id, data);
      } else {
        result = await createQuestion(data);
      }

      if (result.success) {
        toast.success(
          question
            ? "Question updated successfully"
            : "Question created successfully"
        );
        router.push("/teacher/assessments/question-bank");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to save question");
      }
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Question Text */}
      <div className="space-y-2">
        <Label htmlFor="question">Question *</Label>
        <Textarea
          id="question"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Enter your question here..."
          rows={4}
          required
        />
      </div>

      {/* Question Type */}
      <div className="space-y-2">
        <Label htmlFor="questionType">Question Type *</Label>
        <Select
          value={questionType}
          onValueChange={(value) => {
            setQuestionType(value as QuestionType);
            // Reset type-specific fields
            if (value === "TRUE_FALSE") {
              setOptions(["TRUE", "FALSE"]);
              setCorrectAnswer("");
            } else if (value === "MCQ") {
              setOptions(["", "", "", ""]);
              setCorrectAnswer("");
            } else {
              setOptions([]);
              setCorrectAnswer("");
            }
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MCQ">Multiple Choice (MCQ)</SelectItem>
            <SelectItem value="TRUE_FALSE">True/False</SelectItem>
            <SelectItem value="ESSAY">Essay</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* MCQ Options */}
      {questionType === "MCQ" && (
        <div className="space-y-2">
          <Label>Options *</Label>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addOption}>
            <Plus className="h-4 w-4 mr-2" />
            Add Option
          </Button>
        </div>
      )}

      {/* Correct Answer */}
      {questionType !== "ESSAY" && (
        <div className="space-y-2">
          <Label htmlFor="correctAnswer">Correct Answer *</Label>
          {questionType === "MCQ" ? (
            <Input
              id="correctAnswer"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              placeholder="Enter the correct answer exactly as it appears in options"
              required
            />
          ) : (
            <Select value={correctAnswer} onValueChange={setCorrectAnswer}>
              <SelectTrigger>
                <SelectValue placeholder="Select correct answer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRUE">TRUE</SelectItem>
                <SelectItem value="FALSE">FALSE</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Subject */}
        <div className="space-y-2">
          <Label htmlFor="subject">Subject *</Label>
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Topic */}
        <div className="space-y-2">
          <Label htmlFor="topic">Topic (Optional)</Label>
          <Input
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Algebra, Photosynthesis"
          />
        </div>

        {/* Marks */}
        <div className="space-y-2">
          <Label htmlFor="marks">Marks *</Label>
          <Input
            id="marks"
            type="number"
            step="0.5"
            min="0.5"
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
            required
          />
        </div>

        {/* Difficulty */}
        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty *</Label>
          <Select
            value={difficulty}
            onValueChange={(value) => setDifficulty(value as Difficulty)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EASY">Easy</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HARD">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : question ? "Update Question" : "Create Question"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
