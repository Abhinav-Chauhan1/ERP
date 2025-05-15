import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, BookOpen, ClipboardList, Clock } from "lucide-react";

const teachingCategories = [
  {
    title: "Subjects",
    icon: <BookOpen className="h-5 w-5" />,
    description: "Manage academic subjects",
    href: "/admin/teaching/subjects",
    count: 48
  },
  {
    title: "Lessons",
    icon: <ClipboardList className="h-5 w-5" />,
    description: "Create and manage lessons",
    href: "/admin/teaching/lessons",
    count: 324
  },
  {
    title: "Timetable",
    icon: <Clock className="h-5 w-5" />,
    description: "Schedule management",
    href: "/admin/teaching/timetable",
    count: 32
  }
];

const subjectsByDepartment = [
  {
    department: "Science",
    subjects: [
      { id: "s1", name: "Physics", teachers: 6, classes: 10 },
      { id: "s2", name: "Chemistry", teachers: 5, classes: 10 },
      { id: "s3", name: "Biology", teachers: 4, classes: 8 },
    ]
  },
  {
    department: "Mathematics",
    subjects: [
      { id: "m1", name: "Algebra", teachers: 8, classes: 15 },
      { id: "m2", name: "Geometry", teachers: 5, classes: 12 },
      { id: "m3", name: "Statistics", teachers: 3, classes: 6 },
    ]
  },
  {
    department: "Languages",
    subjects: [
      { id: "l1", name: "English", teachers: 10, classes: 32 },
      { id: "l2", name: "Spanish", teachers: 4, classes: 16 },
      { id: "l3", name: "French", teachers: 3, classes: 8 },
    ]
  },
  {
    department: "Social Studies",
    subjects: [
      { id: "ss1", name: "History", teachers: 6, classes: 18 },
      { id: "ss2", name: "Geography", teachers: 4, classes: 16 },
      { id: "ss3", name: "Civics", teachers: 3, classes: 10 },
    ]
  },
];

export default function TeachingPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Teaching Management</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Subject
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {teachingCategories.map((category) => (
          <Card key={category.title} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-md text-blue-700">
                  {category.icon}
                </div>
                <CardTitle className="text-lg">{category.title}</CardTitle>
              </div>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-3xl font-bold">{category.count}</div>
                <Link href={category.href}>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 space-y-6">
        {subjectsByDepartment.map((dept) => (
          <Card key={dept.department}>
            <CardHeader>
              <CardTitle className="text-xl">{dept.department} Department</CardTitle>
              <CardDescription>
                {dept.subjects.length} Subjects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Subject Name</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Teachers</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Classes</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dept.subjects.map((subject) => (
                      <tr key={subject.id} className="border-b">
                        <td className="py-3 px-4 align-middle font-medium">{subject.name}</td>
                        <td className="py-3 px-4 align-middle">{subject.teachers}</td>
                        <td className="py-3 px-4 align-middle">{subject.classes}</td>
                        <td className="py-3 px-4 align-middle text-right">
                          <Link href={`/admin/teaching/subjects/${subject.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
