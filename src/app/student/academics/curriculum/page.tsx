import { Metadata } from "next";
import Link from "next/link";
import { getStudentSubjects } from "@/lib/actions/student-academics-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookMarked, BookOpen, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Curriculum | Student Portal",
  description: "View your class curriculum and syllabus",
};

export default async function CurriculumPage() {
  const subjects = await getStudentSubjects();
  
  // Group subjects by department
  const departments = subjects.reduce((acc: Record<string, typeof subjects>, subject) => {
    if (!acc[subject.department]) {
      acc[subject.department] = [];
    }
    acc[subject.department].push(subject);
    return acc;
  }, {});

  return (
    <div className="container p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Curriculum Overview</h1>
        <p className="text-gray-500">
          Explore the syllabus and curriculum for all your subjects
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(departments).map(([department, departmentSubjects]) => (
          <Card key={department}>
            <CardHeader>
              <CardTitle>{department}</CardTitle>
              <CardDescription>
                {departmentSubjects.length} subject{departmentSubjects.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {departmentSubjects.map(subject => (
                  <div key={subject.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium flex items-center">
                          <BookOpen className="h-4 w-4 mr-2 text-blue-600" />
                          {subject.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{subject.code}</p>
                      </div>
                      {subject.hasSyllabus ? (
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          <BookMarked className="h-3 w-3 mr-1" />
                          Syllabus
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          No Syllabus
                        </Badge>
                      )}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button variant="ghost" size="sm" className="text-blue-600" asChild>
                        <Link href={`/student/academics/subjects/${subject.id}?tab=curriculum`}>
                          View Details <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
