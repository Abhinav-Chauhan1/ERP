import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from "lucide-react";
import { getUsersOverview, getRecentUsers } from "@/lib/actions/userActions";

export default async function UsersPage() {
  const [overviewResult, recentUsersResult] = await Promise.all([
    getUsersOverview(),
    getRecentUsers(10),
  ]);

  const overview = overviewResult.success ? overviewResult.data : {
    administrators: 0,
    teachers: 0,
    students: 0,
    parents: 0,
  };

  const recentUsers = recentUsersResult.success ? recentUsersResult.data : [];

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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add User
          </Button>
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
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Name</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Email</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Role</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Added</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map((user) => (
                      <tr key={user.id} className="border-b">
                        <td className="py-3 px-4 align-middle">
                          <div className="font-medium">{user.name}</div>
                        </td>
                        <td className="py-3 px-4 align-middle">{user.email}</td>
                        <td className="py-3 px-4 align-middle">
                          <Badge variant="outline" className="capitalize">{user.role.toLowerCase()}</Badge>
                        </td>
                        <td className="py-3 px-4 align-middle">{user.date}</td>
                        <td className="py-3 px-4 align-middle">
                          <Badge 
                            className={user.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-amber-100 text-amber-800 hover:bg-amber-100'}
                          >
                            {user.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                          <Button variant="ghost" size="sm">View</Button>
                          <Button variant="ghost" size="sm">Edit</Button>
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
    </>
  );
}
