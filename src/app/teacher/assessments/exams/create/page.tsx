"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar as CalendarIcon,
  Clock,
  ArrowLeft,
  FileText,
  Check
} from "lucide-react";
import { format } from "date-fns";
import { getTeacherSubjects, getSubjectSyllabusUnits } from "@/lib/actions/teacherSubjectsActions";
import { getExamTypes, getActiveTerms, createExam } from "@/lib/actions/teacherExamsActions";
import { toast } from "react-hot-toast";

export default function CreateExamPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedExamType, setSelectedExamType] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [examDate, setExamDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [totalMarks, setTotalMarks] = useState("100");
  const [passingMarks, setPassingMarks] = useState("35");
  const [instructions, setInstructions] = useState("");
  
  // Options for selects
  const [subjects, setSubjects] = useState<any[]>([]);
  const [examTypes, setExamTypes] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch subjects
        const { subjects } = await getTeacherSubjects();
        setSubjects(subjects);
        
        // Fetch exam types
        const { examTypes } = await getExamTypes();
        setExamTypes(examTypes);
        
        // Fetch terms
        const { terms } = await getActiveTerms();
        setTerms(terms);
        
        // Set default values
        if (subjects.length > 0) {
          setSelectedSubject(subjects[0].id);
          fetchUnitsForSubject(subjects[0].id);
        }
        
        if (examTypes.length > 0) {
          setSelectedExamType(examTypes[0].id);
        }
        
        if (terms.length > 0) {
          setSelectedTerm(terms[0].id);
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
    setStartTime(`${String(now.getHours()).padStart(2, '0')}:00`);
    setEndTime(`${String(now.getHours() + 2).padStart(2, '0')}:00`);
  }, []);
  
  // Fetch units when subject changes
  const fetchUnitsForSubject = async (subjectId: string) => {
    try {
      const { units } = await getSubjectSyllabusUnits(subjectId);
      setUnits(units);
      if (units.length > 0) {
        setSelectedUnit(units[0].id);
      } else {
        setSelectedUnit("");
      }
    } catch (error) {
      console.error("Failed to fetch units:", error);
      toast.error("Failed to load syllabus units");
    }
  };
  
  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
    fetchUnitsForSubject(value);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!examDate) {
      toast.error("Please select an exam date");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create start and end datetime objects
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      const startDateTime = new Date(examDate);
      startDateTime.setHours(startHour, startMinute);
      
      const endDateTime = new Date(examDate);
      endDateTime.setHours(endHour, endMinute);
      
      const formData = new FormData();
      formData.append("title", title);
      formData.append("subjectId", selectedSubject);
      formData.append("examTypeId", selectedExamType);
      formData.append("termId", selectedTerm);
      formData.append("examDate", examDate.toISOString());
      formData.append("startTime", startDateTime.toISOString());
      formData.append("endTime", endDateTime.toISOString());
      formData.append("totalMarks", totalMarks);
      formData.append("passingMarks", passingMarks);
      formData.append("instructions", instructions);
      
      const result = await createExam(formData);
      
      if (result.success) {
        toast.success("Exam created successfully");
        router.push(`/teacher/assessments/exams/${result.examId}`);
      } else {
        toast.error(result.error || "Failed to create exam");
      }
    } catch (error) {
      console.error("Failed to create exam:", error);
      toast.error("An error occurred while creating the exam");
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
        <Link href="/teacher/assessments/exams">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex justify-between items-center flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Create New Exam</h1>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the exam details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Exam Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Mid-Term Mathematics Examination"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
                <Label htmlFor="unit">Syllabus Unit (Optional)</Label>
                <Select
                  value={selectedUnit}
                  onValueChange={setSelectedUnit}
                  disabled={units.length === 0}
                >
                  <SelectTrigger id="unit">
                    <SelectValue placeholder="Select a unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.title}
                      </SelectItem>
                    ))}
                    {units.length === 0 && (
                      <SelectItem value="none" disabled>
                        No units available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="exam-type">Exam Type</Label>
                <Select
                  value={selectedExamType}
                  onValueChange={setSelectedExamType}
                >
                  <SelectTrigger id="exam-type">
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    {examTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="term">Academic Term</Label>
                <Select
                  value={selectedTerm}
                  onValueChange={setSelectedTerm}
                >
                  <SelectTrigger id="term">
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map((term) => (
                      <SelectItem key={term.id} value={term.id}>
                        {term.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Schedule & Grading</CardTitle>
              <CardDescription>Set exam date, time and marking scheme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Exam Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {examDate ? format(examDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={examDate}
                      onSelect={setExamDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-gray-500" />
                    <Input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-gray-500" />
                    <Input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total-marks">Total Marks</Label>
                  <Input
                    id="total-marks"
                    type="number"
                    min="1"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="passing-marks">Passing Marks</Label>
                  <Input
                    id="passing-marks"
                    type="number"
                    min="1"
                    max={parseInt(totalMarks)}
                    value={passingMarks}
                    onChange={(e) => setPassingMarks(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions (Optional)</Label>
                <Textarea
                  id="instructions"
                  placeholder="Enter exam instructions for students"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/teacher/assessments/exams')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Exam"}
          </Button>
        </div>
      </form>
    </div>
  );
}
