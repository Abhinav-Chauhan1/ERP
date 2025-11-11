import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { ParentsTable } from "@/components/users/parents-table";

export const metadata = {
  title: "Parents - School ERP",
};

export default async function ParentsPage() {
  const parents = await db.parent.findMany({
    include: {
      user: true,
      children: {
        include: {
          student: {
            include: {
              user: true
            }
          }
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
          <h1 className="text-2xl font-bold tracking-tight">Parents</h1>
          <p className="text-muted-foreground mt-1">
            Manage parent accounts and student relationships
          </p>
        </div>
        <Link href="/admin/users/parents/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Parent
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-xl">All Parents ({parents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ParentsTable parents={parents} />
        </CardContent>
      </Card>
    </div>
  );
}
