import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { TeachersTable } from "@/components/users/teachers-table";

export const metadata = {
  title: "Teachers - School ERP",
};

export default async function TeachersPage() {
  const teachers = await db.teacher.findMany({
    include: {
      user: true,
      subjects: {
        include: {
          subject: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

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
          <CardTitle className="text-xl">All Teachers ({teachers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <TeachersTable teachers={teachers} />
        </CardContent>
      </Card>
    </div>
  );
}
