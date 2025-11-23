import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonUserTableProps {
  rows?: number;
  showAvatar?: boolean;
}

/**
 * Skeleton loader for user tables (students, teachers, parents)
 * Matches the dimensions of actual user table rows
 */
export function SkeletonUserTable({ 
  rows = 10,
  showAvatar = true 
}: SkeletonUserTableProps) {
  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 flex-1 max-w-md" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-accent border-b">
                <th className="py-3 px-4 text-left">
                  <Skeleton className="h-4 w-20" />
                </th>
                <th className="py-3 px-4 text-left">
                  <Skeleton className="h-4 w-24" />
                </th>
                <th className="py-3 px-4 text-left">
                  <Skeleton className="h-4 w-16" />
                </th>
                <th className="py-3 px-4 text-left">
                  <Skeleton className="h-4 w-20" />
                </th>
                <th className="py-3 px-4 text-left">
                  <Skeleton className="h-4 w-24" />
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
              {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b">
                  <td className="py-3 px-4 align-middle whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {showAvatar && (
                        <Skeleton className="h-8 w-8 rounded-full" />
                      )}
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </td>
                  <td className="py-3 px-4 align-middle">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="py-3 px-4 align-middle">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="py-3 px-4 align-middle">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="py-3 px-4 align-middle">
                    <Skeleton className="h-4 w-28" />
                  </td>
                  <td className="py-3 px-4 align-middle">
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </td>
                  <td className="py-3 px-4 align-middle text-right">
                    <div className="flex gap-2 justify-end">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  );
}
