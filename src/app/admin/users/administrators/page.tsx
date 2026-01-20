export const dynamic = 'force-dynamic';

import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { AdministratorsTable } from "@/components/users/administrators-table";

export const metadata = {
  title: "Administrators - SikshaMitra",
};

export default async function AdministratorsPage() {
  const administrators = await db.administrator.findMany({
    include: {
      user: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Administrators</h1>
          <p className="text-muted-foreground mt-1">
            Manage administrative staff and system access
          </p>
        </div>
        <Link href="/admin/users/administrators/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Administrator
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-xl">All Administrators ({administrators.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <AdministratorsTable administrators={administrators} />
        </CardContent>
      </Card>
    </div>
  );
}
