"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronLeft, Edit, BookOpen, Users, 
  GraduationCap, Clock, FileText, Plus,
  BookMarked, Download, PenTool
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Mock data - replace with actual API calls
const subjectsData = [
  {
    id: "1",
    code: "PHY101",
    name: "Physics",
    department: "Science",
    description: "Study of matter, energy, and the interaction between them. This foundational course explores mechanics, thermodynamics, waves, electricity, magnetism, and introduces modern physics concepts.",
    hasLabs: true,
    grades: ["Grade 9", "Grade 10", "Grade 11", "Grade 12"],
    teachers: [
      { id: "t1", name: "John Smith", avatar: "/avatars/01.png", qualification: "PhD, Physics", classes: ["Grade 10 A", "Grade 11 B"] },
      { id: "t2", name: "Emily Johnson", avatar: "/avatars/02.png", qualification: "MSc, Applied Physics", classes: ["Grade 9 A", "Grade 9 B"] },
      { id: "t3", name: "Robert Brown", avatar: "/avatars/03.png", qualification: "MSc, Physics", classes: ["Grade 12 A"] },
    ],
    classes: [
      { id: "c1", name: "Grade 9 A", students: 28, teacher: "Emily Johnson" },
      { id: "c2", name: "Grade 9 B", students: 26, teacher: "Emily Johnson" },
      { id: "c3", name: "Grade 10 A", students: 30, teacher: "John Smith" },
      { id: "c4", name: "Grade 11 B", students: 25, teacher: "John Smith" },
      { id: "c5", name: "Grade 12 A", students: 22, teacher: "Robert Brown" },
    ],
    syllabus: {
      units: [
        { 
          id: "u1", 
          title: "Mechanics", 
          lessons: [
            { id: "l1", title: "Kinematics", duration: "6 hrs" },
            { id: "l2", title: "Laws of Motion", duration: "8 hrs" },
            { id: "l3", title: "Work, Energy and Power", duration: "6 hrs" },
          ]
        },
        { 
          id: "u2", 
          title: "Thermodynamics", 
          lessons: [
            { id: "l4", title: "Heat and Temperature", duration: "4 hrs" },
            { id: "l5", title: "Thermal Properties of Matter", duration: "5 hrs" },
            { id: "l6", title: "Laws of Thermodynamics", duration: "7 hrs" },
          ]
        },
        { 
          id: "u3", 
          title: "Waves", 
          lessons: [
            { id: "l7", title: "Wave Motion", duration: "4 hrs" },
            { id: "l8", title: "Sound Waves", duration: "5 hrs" },
            { id: "l9", title: "Light Waves", duration: "6 hrs" },
          ]
        }
      ]
    },
    resources: [
      { id: "r1", name: "Physics Textbook", type: "Book", link: "#" },
      { id: "r2", name: "Laboratory Manual", type: "PDF", link: "#" },
      { id: "r3", name: "Physics Formula Sheet", type: "PDF", link: "#" },
      { id: "r4", name: "Interactive Simulations", type: "Website", link: "#" },
    ]
  },
  // Add more subjects as needed
];

export default function SubjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [subject, setSubject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch subject details - replace with actual API call
    const id = params.id as string;
    const foundSubject = subjectsData.find(s => s.id === id);
    
    if (foundSubject) {
      setSubject(foundSubject);
    } else {
      // Handle not found case
      router.push('/admin/teaching/subjects');
    }
    
    setLoading(false);
  }, [params.id, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!subject) {
    return <div>Subject not found</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/teaching/subjects">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Subjects
            </Button>
          </Link>
        </div>
        <Link href={`/admin/teaching/subjects/${subject.id}/edit`}>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Subject
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-md text-blue-700">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-2xl">{subject.name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <span className="font-semibold">{subject.code}</span>
                  <span className="text-sm text-gray-500">|</span>
                  <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                    {subject.department}
                  </Badge>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-medium mb-2">Description</h3>
            <p className="text-gray-700 mb-4">{subject.description}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <BookMarked className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                <span className="text-xs block text-gray-600">Subject Type</span>
                <span className="font-medium">{subject.hasLabs ? "Theory + Lab" : "Theory"}</span>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <Users className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <span className="text-xs block text-gray-600">Teachers</span>
                <span className="font-medium">{subject.teachers.length}</span>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <GraduationCap className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                <span className="text-xs block text-gray-600">Classes</span>
                <span className="font-medium">{subject.classes.length}</span>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg text-center">
                <Clock className="h-6 w-6 text-amber-600 mx-auto mb-1" />
                <span className="text-xs block text-gray-600">Lessons</span>
                <span className="font-medium">
                  {subject.syllabus.units.reduce((total: number, unit: any) => total + unit.lessons.length, 0)}
                </span>
              </div>
            </div>
            
            <h3 className="font-medium mb-2">Applicable Grades</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {subject.grades.map((grade: string) => (
                <Badge key={grade} variant="outline">
                  {grade}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resources</CardTitle>
            <CardDescription>
              Subject materials and references
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subject.resources.map((resource: any) => (
              <div key={resource.id} className="flex justify-between items-center p-3 border rounded-md">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-blue-50 rounded-md text-blue-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{resource.name}</p>
                    <p className="text-xs text-gray-500">{resource.type}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <a href={resource.link} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="syllabus" className="mt-2">
        <TabsList>
          <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="syllabus" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Subject Syllabus</CardTitle>
                <CardDescription>
                  View and manage course outline and lessons
                </CardDescription>
              </div>
              <Button size="sm">
                <PenTool className="h-4 w-4 mr-2" />
                Edit Syllabus
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {subject.syllabus.units.map((unit: any) => (
                  <div key={unit.id} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-4 border-b">
                      <h3 className="font-medium">{unit.title}</h3>
                    </div>
                    <div className="divide-y">
                      {unit.lessons.map((lesson: any) => (
                        <div key={lesson.id} className="p-4 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-gray-100 rounded-md text-gray-500">
                              <BookOpen className="h-4 w-4" />
                            </div>
                            <span>{lesson.title}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">{lesson.duration}</span>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Syllabus
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Unit
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="teachers" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Teachers</CardTitle>
                <CardDescription>
                  Teachers currently teaching this subject
                </CardDescription>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Assign Teacher
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {subject.teachers.map((teacher: any) => (
                  <div key={teacher.id} className="border rounded-lg p-4 flex gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={teacher.avatar} />
                      <AvatarFallback>{teacher.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-medium">{teacher.name}</h3>
                      <p className="text-sm text-gray-500">{teacher.qualification}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {teacher.classes.map((cls: string) => (
                          <Badge key={cls} variant="outline" className="text-xs">
                            {cls}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 self-start">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="classes" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Classes</CardTitle>
                <CardDescription>
                  Classes where this subject is taught
                </CardDescription>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add to Class
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Class</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Teacher</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Students</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subject.classes.map((cls: any) => (
                      <tr key={cls.id} className="border-b">
                        <td className="py-3 px-4 align-middle font-medium">{cls.name}</td>
                        <td className="py-3 px-4 align-middle">{cls.teacher}</td>
                        <td className="py-3 px-4 align-middle">{cls.students}</td>
                        <td className="py-3 px-4 align-middle text-right">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                          <Button variant="ghost" size="sm">
                            Timetable
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
