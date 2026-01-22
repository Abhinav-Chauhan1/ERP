"use client";


import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Shuffle,
  Clock,
  Calendar as CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import {
  getTeacherSubjectsForExam,
  getClassesForExam,
  getQuestionBanks,
  getSubjectTopics,
  createOnlineExam,
  selectRandomQuestions,
} from "@/lib/actions/onlineExamActions";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";

interface Question {
  id: string;
  question: string;
  questionType: string;
  marks: number;
  difficulty: string;
  topic?: string;
}

export default function CreateOnlineExamPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [duration, setDuration] = useState("60");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [endTime, setEndTime] = useState("");
  const [instructions, setInstructions] = useState("");
  const [randomizeQuestions, setRandomizeQuestions] = useState(true);
  const [allowReview, setAllowReview] = useState(true);

  // Question selection state
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [filterTopic, setFilterTopic] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [topics, setTopics] = useState<string[]>([]);

  // Random selection state
  const [randomCount, setRandomCount] = useState("10");
  const [randomTopic, setRandomTopic] = useState("any");
  const [randomDifficulty, setRandomDifficulty] = useState("any");
  const [randomType, setRandomType] = useState("any");

  // Options for selects
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [subjectsRes, classesRes] = await Promise.all([
          getTeacherSubjectsForExam(),
          getClassesForExam(),
        ]);

        if (subjectsRes.success && subjectsRes.subjects) {
          setSubjects(subjectsRes.subjects);
          if (subjectsRes.subjects.length > 0) {
            setSelectedSubject(subjectsRes.subjects[0].id);
            fetchQuestionsForSubject(subjectsRes.subjects[0].id);
          }
        }

        if (classesRes.success && classesRes.classes) {
          setClasses(classesRes.classes);
          if (classesRes.classes.length > 0) {
            setSelectedClass(classesRes.classes[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to load required data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set default times
    const now = new Date();
    setStartTime(`${String(now.getHours()).padStart(2, "0")}:00`);
    setEndTime(`${String(now.getHours() + 2).padStart(2, "0")}:00`);
  }, []);

  // Fetch questions when subject changes
  const fetchQuestionsForSubject = async (subjectId: string) => {
    try {
      const [questionsRes, topicsRes] = await Promise.all([
        getQuestionBanks({ subjectId }),
        getSubjectTopics(subjectId),
      ]);

      if (questionsRes.success && questionsRes.questions) {
        setAvailableQuestions(questionsRes.questions as any);
      }

      if (topicsRes.success && topicsRes.topics) {
        setTopics(topicsRes.topics);
      }
    } catch (error) {
      console.error("Failed to fetch questions:", error);
      toast.error("Failed to load questions");
    }
  };

  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
    setSelectedQuestions([]);
    setFilterTopic("");
    setFilterDifficulty("");
    setFilterType("");
    fetchQuestionsForSubject(value);
  };

  // Filter available questions
  const filteredQuestions = availableQuestions.filter((q) => {
    if (filterTopic !== "all" && q.topic !== filterTopic) return false;
    if (filterDifficulty !== "all" && q.difficulty !== filterDifficulty) return false;
    if (filterType !== "all" && q.questionType !== filterType) return false;
    // Don't show already selected questions
    if (selectedQuestions.find((sq) => sq.id === q.id)) return false;
    return true;
  });

  const handleAddQuestion = (question: Question) => {
    setSelectedQuestions([...selectedQuestions, question]);
  };

  const handleRemoveQuestion = (questionId: string) => {
    setSelectedQuestions(selectedQuestions.filter((q) => q.id !== questionId));
  };

  const handleRandomSelection = async () => {
    if (!selectedSubject) {
      toast.error("Please select a subject first");
      return;
    }

    const count = parseInt(randomCount);
    if (isNaN(count) || count <= 0) {
      toast.error("Please enter a valid number of questions");
      return;
    }

    try {
      const result = await selectRandomQuestions({
        subjectId: selectedSubject,
        count,
        topic: randomTopic === "any" ? undefined : randomTopic,
        difficulty: randomDifficulty === "any" ? undefined : randomDifficulty,
        questionType: randomType === "any" ? undefined : randomType,
      });

      if (result.success && result.questions) {
        setSelectedQuestions(result.questions as any);
        toast.success(`Selected ${result.questions.length} random questions`);
      } else {
        toast.error(result.error || "Failed to select questions");
      }
    } catch (error) {
      console.error("Failed to select random questions:", error);
      toast.error("An error occurred while selecting questions");
    }
  };

  const calculateTotalMarks = () => {
    return selectedQuestions.reduce((sum, q) => sum + q.marks, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedQuestions.length === 0) {
      toast.error("Please select at least one question");
      return;
    }

    if (!startDate || !endDate) {
      toast.error("Please select start and end dates");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create start and end datetime objects
      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);

      const startDateTime = new Date(startDate);
      startDateTime.setHours(startHour, startMinute, 0, 0);

      const endDateTime = new Date(endDate);
      endDateTime.setHours(endHour, endMinute, 0, 0);

      const result = await createOnlineExam({
        title,
        subjectId: selectedSubject,
        classId: selectedClass,
        duration: parseInt(duration),
        totalMarks: calculateTotalMarks(),
        questionIds: selectedQuestions.map((q) => q.id),
        startTime: startDateTime,
        endTime: endDateTime,
        instructions,
        randomizeQuestions,
        allowReview,
      });

      if (result.success) {
        toast.success("Online exam created successfully");
        router.push(`/teacher/assessments/online-exams/${result.exam?.id}`);
      } else {
        toast.error(result.error || "Failed to create online exam");
      }
    } catch (error) {
      console.error("Failed to create online exam:", error);
      toast.error("An error occurred while creating the online exam");
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="flex items-center gap-3">
        <Link href="/teacher/assessments/online-exams">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex justify-between items-center flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Create Online Exam
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the exam details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Exam Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Mid-Term Mathematics Online Test"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select
                    value={selectedSubject}
                    onValueChange={handleSubjectChange}
                  >
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="Select a subject" />
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

                <div className="space-y-2">
                  <Label htmlFor="class">Class</Label>
                  <Select
                    value={selectedClass}
                    onValueChange={setSelectedClass}
                  >
                    <SelectTrigger id="class">
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions (Optional)</Label>
                <Textarea
                  id="instructions"
                  placeholder="Enter exam instructions for students"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="randomize"
                    checked={randomizeQuestions}
                    onCheckedChange={(checked) =>
                      setRandomizeQuestions(checked as boolean)
                    }
                  />
                  <Label htmlFor="randomize" className="cursor-pointer">
                    Randomize question order
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="review"
                    checked={allowReview}
                    onCheckedChange={(checked) =>
                      setAllowReview(checked as boolean)
                    }
                  />
                  <Label htmlFor="review" className="cursor-pointer">
                    Allow answer review before submit
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
              <CardDescription>Set exam start and end times</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Start Date & Time</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <DatePicker
                        date={startDate}
                        onSelect={setStartDate}
                        placeholder="Pick a date"
                      />
                    </div>
                    <div className="flex items-center w-32">
                      <TimePicker
                        date={startTime ? new Date(`2000-01-01T${startTime}:00`) : undefined}
                        setDate={(date) => {
                          setStartTime(date ? format(date, "HH:mm") : "");
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>End Date & Time</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <DatePicker
                        date={endDate}
                        onSelect={setEndDate}
                        placeholder="Pick a date"
                      />
                    </div>
                    <div className="flex items-center w-32">
                      <TimePicker
                        date={endTime ? new Date(`2000-01-01T${endTime}:00`) : undefined}
                        setDate={(date) => {
                          setEndTime(date ? format(date, "HH:mm") : "");
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Question Selection</CardTitle>
              <CardDescription>
                Select questions from the question bank or use random selection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Random Selection */}
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center gap-2">
                  <Shuffle className="h-5 w-5" />
                  <h3 className="font-semibold">Random Selection</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-5">
                  <div className="space-y-2">
                    <Label htmlFor="random-count">Number of Questions</Label>
                    <Input
                      id="random-count"
                      type="number"
                      min="1"
                      value={randomCount}
                      onChange={(e) => setRandomCount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="random-topic">Topic (Optional)</Label>
                    <Select value={randomTopic} onValueChange={setRandomTopic}>
                      <SelectTrigger id="random-topic">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Topic</SelectItem>
                        {topics.map((topic) => (
                          <SelectItem key={topic} value={topic}>
                            {topic}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="random-difficulty">
                      Difficulty (Optional)
                    </Label>
                    <Select
                      value={randomDifficulty}
                      onValueChange={setRandomDifficulty}
                    >
                      <SelectTrigger id="random-difficulty">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Difficulty</SelectItem>
                        <SelectItem value="EASY">Easy</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HARD">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="random-type">Type (Optional)</Label>
                    <Select value={randomType} onValueChange={setRandomType}>
                      <SelectTrigger id="random-type">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Type</SelectItem>
                        <SelectItem value="MCQ">MCQ</SelectItem>
                        <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                        <SelectItem value="ESSAY">Essay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={handleRandomSelection}
                      className="w-full"
                    >
                      <Shuffle className="mr-2 h-4 w-4" />
                      Select Random
                    </Button>
                  </div>
                </div>
              </div>

              {/* Manual Selection */}
              <div className="space-y-4">
                <h3 className="font-semibold">Manual Selection</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="filter-topic">Filter by Topic</Label>
                    <Select value={filterTopic} onValueChange={setFilterTopic}>
                      <SelectTrigger id="filter-topic">
                        <SelectValue placeholder="All Topics" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Topics</SelectItem>
                        {topics.map((topic) => (
                          <SelectItem key={topic} value={topic}>
                            {topic}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="filter-difficulty">
                      Filter by Difficulty
                    </Label>
                    <Select
                      value={filterDifficulty}
                      onValueChange={setFilterDifficulty}
                    >
                      <SelectTrigger id="filter-difficulty">
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
                  <div className="space-y-2">
                    <Label htmlFor="filter-type">Filter by Type</Label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger id="filter-type">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="MCQ">MCQ</SelectItem>
                        <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                        <SelectItem value="ESSAY">Essay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  {filteredQuestions.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No questions available
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredQuestions.map((question) => (
                        <div
                          key={question.id}
                          className="p-3 flex items-start justify-between hover:bg-muted/50"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium line-clamp-2">
                              {question.question}
                            </p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {question.questionType}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {question.difficulty}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {question.marks} marks
                              </Badge>
                              {question.topic && (
                                <Badge variant="outline" className="text-xs">
                                  {question.topic}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAddQuestion(question)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Questions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    Selected Questions ({selectedQuestions.length})
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    Total Marks: {calculateTotalMarks()}
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  {selectedQuestions.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No questions selected
                    </div>
                  ) : (
                    <div className="divide-y">
                      {selectedQuestions.map((question, index) => (
                        <div
                          key={question.id}
                          className="p-3 flex items-start justify-between"
                        >
                          <div className="flex gap-3 flex-1">
                            <span className="text-sm font-medium text-muted-foreground">
                              {index + 1}.
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-medium line-clamp-2">
                                {question.question}
                              </p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {question.questionType}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {question.difficulty}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {question.marks} marks
                                </Badge>
                                {question.topic && (
                                  <Badge variant="outline" className="text-xs">
                                    {question.topic}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveQuestion(question.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/teacher/assessments/online-exams")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Online Exam"}
          </Button>
        </div>
      </form>
    </div>
  );
}

