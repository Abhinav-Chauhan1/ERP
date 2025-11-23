export const dynamic = 'force-dynamic';

import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { TeachersWithFilters } from "./teachers-with-filters";
import { getTeacherFilterOptions } from "@/lib/actions/teachers-filters";

export const metadata = {
  title: "Teachers - School ERP",
};

export default async function TeachersPage() {
  const [teachers, filterOptions] = await Promise.all([
    db.teacher.findMany({
      include: {
        user: true,
        subjects: {
          include: {
            subject: true,
          },
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teachers</h1>
          <p className="text-muted-foreground mt-1">
            Manage teaching staff and subject assignments
          </p>
        </div>
        <Link href="/admin/users/teachers/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Teacher
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-xl">All Teachers</CardTitle>
        </CardHeader>
        <CardContent>
          <TeachersWithFilters
            initialTeachers={teachers}
            subjects={filterOptions.subjects}
            departments={filterOptions.departments}
          />
        </CardContent>
      </Card>
    </div>
  );
}
