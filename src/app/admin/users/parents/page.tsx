import Link from "next/link";
import { PlusCircle, SearchIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

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
        <h1 className="text-2xl font-bold tracking-tight">Parents</h1>
        <Link href="/admin/users/parents/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Parent
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search parents..."
            className="w-full pl-8"
          />
        </div>
        <Button variant="outline">Filters</Button>
      </div>

      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-xl">All Parents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Name</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Email</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Phone</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Children</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Relation</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                    <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {parents.map((parent) => (
                    <tr key={parent.id} className="border-b">
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {parent.user.avatar ? (
                            <img
                              src={parent.user.avatar}
                              alt={`${parent.user.firstName} ${parent.user.lastName}`}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                              {parent.user.firstName[0]}
                              {parent.user.lastName[0]}
                            </div>
                          )}
                          <div className="font-medium">
                            {parent.user.firstName} {parent.user.lastName}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 align-middle">{parent.user.email}</td>
                      <td className="py-3 px-4 align-middle">{parent.user.phone || parent.alternatePhone || "N/A"}</td>
                      <td className="py-3 px-4 align-middle">
                        <div className="flex flex-wrap gap-1">
                          {parent.children.length > 0 ? (
                            parent.children.slice(0, 2).map((child) => (
                              <Badge key={child.id} variant="outline">
                                {child.student.user.firstName} {child.student.user.lastName}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-500">No children</span>
                          )}
                          {parent.children.length > 2 && (
                            <Badge variant="outline">+{parent.children.length - 2} more</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 align-middle capitalize">{parent.relation?.toLowerCase() || "N/A"}</td>
                      <td className="py-3 px-4 align-middle">
                        <Badge 
                          className={parent.user.active ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}
                        >
                          {parent.user.active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 align-middle text-right">
                        <Link href={`/admin/users/parents/${parent.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                        <Link href={`/admin/users/parents/${parent.id}/edit`}>
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
