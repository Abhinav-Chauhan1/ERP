import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsersLoading() {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-28 mb-1" />
              <Skeleton className="h-4 w-36" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Users Table */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-1" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-accent border-b">
                    <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-16" /></th>
                    <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-20" /></th>
                    <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-12" /></th>
                    <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-16" /></th>
                    <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-14" /></th>
                    <th className="py-3 px-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-3 px-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-4 w-40" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-8 w-12" />
                          <Skeleton className="h-8 w-12" />
                        </div>
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
