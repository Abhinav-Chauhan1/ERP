import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AcademicLoading() {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-48" />
      </div>

      {/* Academic Sections Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <Skeleton className="h-9 w-12" />
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Academic Years Table */}
      <Card className="mt-6">
        <CardHeader>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-accent border-b">
                    <th className="py-3 px-4 text-left">
                      <Skeleton className="h-4 w-24" />
                    </th>
                    <th className="py-3 px-4 text-left">
                      <Skeleton className="h-4 w-20" />
                    </th>
                    <th className="py-3 px-4 text-left">
                      <Skeleton className="h-4 w-20" />
                    </th>
                    <th className="py-3 px-4 text-left">
                      <Skeleton className="h-4 w-16" />
                    </th>
                    <th className="py-3 px-4 text-left">
                      <Skeleton className="h-4 w-16" />
                    </th>
                    <th className="py-3 px-4 text-left">
                      <Skeleton className="h-4 w-16" />
                    </th>
                    <th className="py-3 px-4 text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-8" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-8" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Skeleton className="h-8 w-16 ml-auto" />
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
