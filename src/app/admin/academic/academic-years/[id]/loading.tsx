import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function AcademicYearDetailLoading() {
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
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Terms Table */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24 mb-2" />
          <Skeleton className="h-4 w-48" />
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classes Table */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24 mb-2" />
          <Skeleton className="h-4 w-56" />
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
                      <Skeleton className="h-4 w-24" />
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
                        <Skeleton className="h-4 w-8" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-8" />
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
