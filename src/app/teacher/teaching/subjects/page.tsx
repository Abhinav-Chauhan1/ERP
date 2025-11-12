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
import { BookOpen, FileText, Play, Users, Eye } from "lucide-react";
import { SyllabusProgress } from "@/components/academic/syllabus-progress";
import { getTeacherSubjects } from "@/lib/actions/teacherSubjectsActions";

export const dynamic = 'force-dynamic';

export default async function TeacherSubjectsPage() {
  const { subjects } = await getTeacherSubjects();

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
        {subjects.map((subject) => (
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
              <Link href={`/teacher/teaching/subjects/${subject.id}`}>
                <Button variant="outline" size="sm" className="h-8">
                  <Eye className="h-3.5 w-3.5 mr-1" /> View Details
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
      
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-4">Syllabus Progress</h2>
        
        <Tabs defaultValue={subjects[0]?.id} className="mt-2">
          <TabsList className="mb-4">
            {subjects.map((subject) => (
              <TabsTrigger key={subject.id} value={subject.id}>
                {subject.grade} {subject.sections.join(", ")}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {subjects.map((subject) => (
            <TabsContent key={subject.id} value={subject.id}>
              <SyllabusProgress 
                subjectName={subject.name}
                className={`${subject.grade} (${subject.sections.join(", ")})`}
                academicYear="2023-2024"
                overallProgress={subject.progress}
                lastUpdated="December 1, 2023"
                units={(subject.syllabus[0]?.units || []).map(unit => ({
                  ...unit,
                  status: (unit.status as "completed" | "in-progress" | "not-started") || "not-started"
                }))}
                subjectId={subject.id} // Pass subjectId instead of onUpdate
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
