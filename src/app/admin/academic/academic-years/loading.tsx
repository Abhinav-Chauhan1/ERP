import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function AcademicYearsLoading() {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" disabled>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>

      {/* Academic Years Table */}
      <Card>
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
                  {Array.from({ length: 5 }).map((_, i) => (
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
                      <td className="py-3 px-4">
                        <div className="flex gap-1 justify-end">
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
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
