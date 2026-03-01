export const dynamic = 'force-dynamic';

import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { TeachersWithFilters } from "./teachers-with-filters";
import { getTeacherFilterOptions } from "@/lib/actions/teachers-filters";

export const metadata = {
  title: "Teachers - SikshaMitra",
};

export default async function TeachersPage() {
  // CRITICAL: Add school isolation
  const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
  const schoolId = await getRequiredSchoolId();

  const [teachers, filterOptions] = await Promise.all([
    db.teacher.findMany({
      where: {
        schoolId, // CRITICAL: Filter by current school
      },
      include: {
        user: true,
        subjects: {
          include: {
            subject: true,
          },
        },
        classes: {
          include: {
            class: true,
            section: true,
          }
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    getTeacherFilterOptions(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teachers</h1>
          <p className="text-muted-foreground mt-1">
            Manage teaching staff and subject assignments
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/users/teachers/create">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Teacher
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-xl">All Teachers</CardTitle>
        </CardHeader>
        <CardContent>
          <TeachersWithFilters
            initialTeachers={JSON.parse(JSON.stringify(teachers))}
            subjects={filterOptions.subjects}
          />
        </CardContent>
      </Card>
    </div>
  );
}
