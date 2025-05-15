import Link from "next/link";
import { PlusCircle, SearchIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "Administrators - School ERP",
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Administrators</h1>
        <Link href="/admin/users/administrators/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Administrator
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search administrators..."
            className="w-full pl-8"
          />
        </div>
        <Button variant="outline">Filters</Button>
      </div>

      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-xl">All Administrators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Name</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Email</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Position</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Department</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Joined</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                    <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {administrators.map((admin) => (
                    <tr key={admin.id} className="border-b">
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {admin.user.avatar ? (
                            <img
                              src={admin.user.avatar}
                              alt={`${admin.user.firstName} ${admin.user.lastName}`}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                              {admin.user.firstName[0]}
                              {admin.user.lastName[0]}
                            </div>
                          )}
                          <div className="font-medium">
                            {admin.user.firstName} {admin.user.lastName}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 align-middle">{admin.user.email}</td>
                      <td className="py-3 px-4 align-middle">{admin.position || "N/A"}</td>
                      <td className="py-3 px-4 align-middle">{admin.department || "N/A"}</td>
                      <td className="py-3 px-4 align-middle">{formatDate(admin.createdAt)}</td>
                      <td className="py-3 px-4 align-middle">
                        <Badge 
                          className={admin.user.active ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}
                        >
                          {admin.user.active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 align-middle text-right">
                        <Link href={`/admin/users/administrators/${admin.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                        <Link href={`/admin/users/administrators/${admin.id}/edit`}>
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
