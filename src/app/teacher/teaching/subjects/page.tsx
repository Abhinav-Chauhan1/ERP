import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, FileText, Play, Users } from "lucide-react";
import { SyllabusProgress } from "@/components/academic/syllabus-progress";

// Example data
const teacherSubjects = [
  {
    id: "1",
    name: "Mathematics",
    grade: "Grade 10",
    sections: ["A", "B"],
    totalStudents: 61,
    totalClasses: 8,
    completedClasses: 45,
    totalTopics: 24,
    completedTopics: 18,
    progress: 75,
    syllabus: [
      {
        id: "unit1",
        title: "Linear Equations",
        order: 1,
        totalTopics: 8,
        completedTopics: 8,
        status: "completed",
        lastUpdated: "Nov 15, 2023",
      },
      {
        id: "unit2",
        title: "Quadratic Equations",
        order: 2,
        totalTopics: 10,
        completedTopics: 7,
        status: "in-progress",
        lastUpdated: "Nov 28, 2023",
      },
      {
        id: "unit3",
        title: "Coordinate Geometry",
        order: 3,
        totalTopics: 6,
        completedTopics: 3,
        status: "in-progress",
        lastUpdated: "Dec 1, 2023",
      },
      {
        id: "unit4",
        title: "Trigonometry",
        order: 4,
        totalTopics: 8,
        completedTopics: 0,
        status: "not-started",
        lastUpdated: "",
      },
    ]
  },
  {
    id: "2",
    name: "Mathematics",
    grade: "Grade 11",
    sections: ["B"],
    totalStudents: 28,
    totalClasses: 4,
    completedClasses: 23,
    totalTopics: 18,
    completedTopics: 8,
    progress: 44,
    syllabus: [
      {
        id: "unit1",
        title: "Functions",
        order: 1,
        totalTopics: 6,
        completedTopics: 6,
        status: "completed",
        lastUpdated: "Nov 10, 2023",
      },
      {
        id: "unit2",
        title: "Limits and Continuity",
        order: 2,
        totalTopics: 4,
        completedTopics: 2,
        status: "in-progress",
        lastUpdated: "Nov 25, 2023",
      },
      {
        id: "unit3",
        title: "Differentiation",
        order: 3,
        totalTopics: 8,
        completedTopics: 0,
        status: "not-started",
        lastUpdated: "",
      },
    ]
  },
  {
    id: "3",
    name: "Mathematics",
    grade: "Grade 9",
    sections: ["C"],
    totalStudents: 32,
    totalClasses: 4,
    completedClasses: 30,
    totalTopics: 20,
    completedTopics: 18,
    progress: 90,
    syllabus: [
      {
        id: "unit1",
        title: "Number Systems",
        order: 1,
        totalTopics: 5,
        completedTopics: 5,
        status: "completed",
        lastUpdated: "Oct 15, 2023",
      },
      {
        id: "unit2",
        title: "Algebraic Expressions",
        order: 2,
        totalTopics: 6,
        completedTopics: 6,
        status: "completed",
        lastUpdated: "Oct 30, 2023",
      },
      {
        id: "unit3",
        title: "Linear Equations in Two Variables",
        order: 3,
        totalTopics: 5,
        completedTopics: 5,
        status: "completed",
        lastUpdated: "Nov 15, 2023",
      },
      {
        id: "unit4",
        title: "Geometry",
        order: 4,
        totalTopics: 4,
        completedTopics: 2,
        status: "in-progress",
        lastUpdated: "Nov 28, 2023",
      },
    ]
  },
];

export default function TeacherSubjectsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">My Subjects</h1>
        <Link href="/teacher/academics/resources">
          <Button>
            <FileText className="mr-2 h-4 w-4" /> Teaching Resources
          </Button>
        </Link>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {teacherSubjects.map((subject) => (
          <Card key={subject.id}>
            <CardHeader className="pb-2">
              <CardTitle>{subject.name}</CardTitle>
              <CardDescription>
                {subject.grade} ({subject.sections.join(", ")})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-gray-500 text-xs">Students</p>
                  <p className="font-bold">{subject.totalStudents}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-gray-500 text-xs">Classes</p>
                  <p className="font-bold">{subject.completedClasses}/{subject.totalClasses}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-gray-500 text-xs">Progress</p>
                  <p className="font-bold">{subject.progress}%</p>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <p className="text-sm font-medium">Syllabus Coverage</p>
                  <p className="text-sm font-medium">
                    {subject.completedTopics}/{subject.totalTopics} topics
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full" 
                    style={{ width: `${subject.progress}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
            <div className="px-6 pb-4 flex flex-wrap gap-2">
              <Link href={`/teacher/teaching/classes?subject=${subject.id}`}>
                <Button variant="outline" size="sm" className="h-8">
                  <Users className="h-3.5 w-3.5 mr-1" /> Classes
                </Button>
              </Link>
              <Link href={`/teacher/teaching/syllabus?subject=${subject.id}`}>
                <Button variant="outline" size="sm" className="h-8">
                  <BookOpen className="h-3.5 w-3.5 mr-1" /> Syllabus
                </Button>
              </Link>
              <Link href={`/teacher/teaching/lessons?subject=${subject.id}`}>
                <Button variant="outline" size="sm" className="h-8">
                  <Play className="h-3.5 w-3.5 mr-1" /> Lessons
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
      
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-4">Syllabus Progress</h2>
        
        <Tabs defaultValue={teacherSubjects[0].id} className="mt-2">
          <TabsList className="mb-4">
            {teacherSubjects.map((subject) => (
              <TabsTrigger key={subject.id} value={subject.id}>
                {subject.grade} {subject.sections.join(", ")}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {teacherSubjects.map((subject) => (
            <TabsContent key={subject.id} value={subject.id}>
              <SyllabusProgress 
                subjectName={subject.name}
                className={`${subject.grade} (${subject.sections.join(", ")})`}
                academicYear="2023-2024"
                overallProgress={subject.progress}
                lastUpdated="December 1, 2023"
                units={subject.syllabus as any}
                onUpdate={() => console.log(`Update syllabus for ${subject.grade}`)}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
