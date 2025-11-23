export const dynamic = 'force-dynamic';

import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { StudentsWithFilters } from "./students-with-filters";
import { getFilterOptions } from "@/lib/actions/students-filters";

export const metadata = {
  title: "Students - School ERP",
};

export default async function StudentsPage() {
  const [students, filterOptions] = await Promise.all([
    db.student.findMany({
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
        createdAt: "desc",
      },
    }),
    getFilterOptions(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground mt-1">
            Manage student records and enrollments
          </p>
        </div>
        <Link href="/admin/users/students/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Student
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-xl">All Students</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentsWithFilters
            initialStudents={students}
            classes={filterOptions.classes}
            sections={filterOptions.sections}
          />
        </CardContent>
      </Card>
    </div>
  );
}
