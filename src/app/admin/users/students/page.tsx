import Link from "next/link";
import { PlusCircle, SearchIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "Students - School ERP",
};

export default async function StudentsPage() {
  const students = await db.student.findMany({
    include: {
      user: true,
      enrollments: {
        include: {
          class: true,
          section: true,
        },
        where: {
          status: "ACTIVE",
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: 'desc'
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Students</h1>
        <Link href="/admin/users/students/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Student
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search students..."
            className="w-full pl-8"
          />
        </div>
        <Button variant="outline">Filters</Button>
      </div>

      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-xl">All Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Name</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Admission ID</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Class</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Gender</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Admission Date</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                    <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b">
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {student.user.avatar ? (
                            <img
                              src={student.user.avatar}
                              alt={`${student.user.firstName} ${student.user.lastName}`}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                              {student.user.firstName[0]}
                              {student.user.lastName[0]}
                            </div>
                          )}
                          <div className="font-medium">
                            {student.user.firstName} {student.user.lastName}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 align-middle">{student.admissionId}</td>
                      <td className="py-3 px-4 align-middle">
                        {student.enrollments.length > 0 ? (
                          <div>
                            {student.enrollments[0].class.name} - {student.enrollments[0].section.name}
                          </div>
                        ) : (
                          <span className="text-gray-500">Not enrolled</span>
                        )}
                      </td>
                      <td className="py-3 px-4 align-middle capitalize">{student.gender.toLowerCase()}</td>
                      <td className="py-3 px-4 align-middle">{formatDate(student.admissionDate)}</td>
                      <td className="py-3 px-4 align-middle">
                        <Badge 
                          className={student.user.active ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}
                        >
                          {student.user.active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 align-middle text-right">
                        <Link href={`/admin/users/students/${student.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                        <Link href={`/admin/users/students/${student.id}/edit`}>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
