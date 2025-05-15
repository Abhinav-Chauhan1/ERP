import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

const classesByGrade = [
  { grade: "Grade 1", classes: 4, students: 120, sections: ["A", "B", "C", "D"] },
  { grade: "Grade 2", classes: 3, students: 105, sections: ["A", "B", "C"] },
  { grade: "Grade 3", classes: 4, students: 132, sections: ["A", "B", "C", "D"] },
  { grade: "Grade 4", classes: 3, students: 115, sections: ["A", "B", "C"] },
  { grade: "Grade 5", classes: 3, students: 125, sections: ["A", "B", "C"] },
  { grade: "Grade 6", classes: 4, students: 98, sections: ["A", "B", "C", "D"] },
];

const recentClasses = [
  {
    id: "1",
    name: "Grade 10 - Science",
    year: "2023-2024",
    section: "A",
    strength: 35,
    classTeacher: "Emily Johnson",
    room: "Science Block - 101"
  },
  {
    id: "2",
    name: "Grade 10 - Science",
    year: "2023-2024",
    section: "B",
    strength: 32,
    classTeacher: "Michael Davis",
    room: "Science Block - 102"
  },
  {
    id: "3",
    name: "Grade 10 - Commerce",
    year: "2023-2024",
    section: "A",
    strength: 30,
    classTeacher: "David Wilson",
    room: "Commerce Block - 201"
  },
  {
    id: "4",
    name: "Grade 11 - Science",
    year: "2023-2024",
    section: "A",
    strength: 28,
    classTeacher: "Sarah Thompson",
    room: "Science Block - 201"
  },
  {
    id: "5",
    name: "Grade 11 - Arts",
    year: "2023-2024",
    section: "A",
    strength: 25,
    classTeacher: "Robert Brown",
    room: "Arts Block - 301"
  },
];

export default function ClassesPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Class Management</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Class
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {classesByGrade.map((grade) => (
          <Card key={grade.grade} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{grade.grade}</CardTitle>
              <CardDescription>{grade.classes} classes, {grade.students} students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <div className="text-sm text-gray-500 mb-1">Sections:</div>
                <div className="flex flex-wrap gap-1">
                  {grade.sections.map((section) => (
                    <span 
                      key={section}
                      className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                    >
                      {section}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <Link href={`/admin/classes?grade=${grade.grade}`}>
                  <Button variant="outline" size="sm">
                    View Classes
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">All Classes</CardTitle>
              <CardDescription>
                Manage, search and filter all classes
              </CardDescription>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search classes..."
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Class</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Section</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Class Teacher</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Room</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Students</th>
                    <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentClasses.map((cls) => (
                    <tr key={cls.id} className="border-b">
                      <td className="py-3 px-4 align-middle font-medium">
                        {cls.name}
                        <div className="text-xs text-gray-500">{cls.year}</div>
                      </td>
                      <td className="py-3 px-4 align-middle">{cls.section}</td>
                      <td className="py-3 px-4 align-middle">{cls.classTeacher}</td>
                      <td className="py-3 px-4 align-middle">{cls.room}</td>
                      <td className="py-3 px-4 align-middle">{cls.strength}</td>
                      <td className="py-3 px-4 align-middle text-right">
                        <Link href={`/admin/classes/${cls.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-center mt-4">
            <Button variant="outline" size="sm">Load More</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 mt-6 grid-cols-1 md:grid-cols-2">
        <Link href="/admin/classes/sections">
          <Card className="h-full hover:bg-gray-50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Section Management</CardTitle>
              <CardDescription>
                Add or modify class sections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Create and manage sections for each class, assign teachers, and organize students.
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/admin/classes/rooms">
          <Card className="h-full hover:bg-gray-50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Classroom Management</CardTitle>
              <CardDescription>
                Manage physical classrooms and labs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Organize classrooms, labs, and other teaching spaces with capacity information.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
