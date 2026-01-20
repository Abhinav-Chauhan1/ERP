export const dynamic = 'force-dynamic';

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUsersOverview, getRecentUsers } from "@/lib/actions/userActions";
import { getFilterOptions } from "@/lib/actions/students-filters";
import { BulkImportDialog } from "@/components/admin/bulk-import-dialog";
import { RecentUsersTable } from "@/components/users/recent-users-table";

import { requirePermission, PERMISSIONS } from "@/lib/utils/permissions";

export default async function UsersPage() {
  await requirePermission(PERMISSIONS.READ_USER);
  const [overviewResult, recentUsersResult, filterOptions] = await Promise.all([
    getUsersOverview(),
    getRecentUsers(10),
    getFilterOptions(),
  ]);

  const overview = (overviewResult.success && overviewResult.data) ? overviewResult.data : {
    administrators: 0,
    teachers: 0,
    students: 0,
    parents: 0,
  };

  const recentUsers = (recentUsersResult.success && recentUsersResult.data) ? recentUsersResult.data : [];

  const usersOverview = [
    {
      title: "Administrators",
      count: overview.administrators,
      description: "School administrators",
      href: "/admin/users/administrators",
    },
    {
      title: "Teachers",
      count: overview.teachers,
      description: "Teaching staff members",
      href: "/admin/users/teachers",
    },
    {
      title: "Students",
      count: overview.students,
      description: "Enrolled students",
      href: "/admin/users/students",
    },
    {
      title: "Parents",
      count: overview.parents,
      description: "Student parents/guardians",
      href: "/admin/users/parents",
    }
  ];
  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground mt-1">
              Overview of all users across the system
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <BulkImportDialog
              classes={filterOptions.classes}
              sections={filterOptions.sections}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {usersOverview.map((item) => (
            <Card key={item.title} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{item.count}</div>
                <Link href={item.href}>
                  <Button variant="link" className="p-0 h-auto">
                    View {item.title}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recently Added Users</CardTitle>
            <CardDescription>
              Users added in the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentUsersTable users={recentUsers} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
