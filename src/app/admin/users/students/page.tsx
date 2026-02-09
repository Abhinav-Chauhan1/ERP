export const dynamic = 'force-dynamic';

import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { StudentsWithFilters } from "./students-with-filters";
import { getFilterOptions } from "@/lib/actions/students-filters";
import { BulkImportDialog } from "@/components/admin/bulk-import-dialog";

export const metadata = {
  title: "Students - SikshaMitra",
};

export default async function StudentsPage() {
  // CRITICAL: Add school isolation
  const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
  const schoolId = await getRequiredSchoolId();

  const [students, filterOptions] = await Promise.all([
    db.student.findMany({
      where: {
        schoolId, // CRITICAL: Filter by current school
      },
      include: {
        user: true,
        enrollments: {
          include: {
            class: true,
            section: true,
          },
          where: {
            status: "ACTIVE",
            schoolId, // CRITICAL: Filter enrollments by school
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground mt-1">
            Manage student records and enrollments
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <BulkImportDialog
            defaultImportType="student"
            classes={filterOptions.classes}
            sections={filterOptions.sections}
          />
          <Link href="/admin/users/students/create" className="flex-1 sm:flex-none">
            <Button className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Student
            </Button>
          </Link>
        </div>
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
