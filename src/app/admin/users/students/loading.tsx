import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentsLoading() {
    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>

            {/* Card */}
            <Card>
                <CardHeader className="py-4">
                    <CardTitle className="text-xl">
                        <Skeleton className="h-6 w-32" />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Filters */}
                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                                <Skeleton className="h-10 w-48" />
                                <Skeleton className="h-10 w-32" />
                                <Skeleton className="h-10 w-32" />
                            </div>
                        </div>

                        {/* Student count */}
                        <Skeleton className="h-4 w-40" />

                        {/* Search and filters */}
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-10 flex-1 max-w-md" />
                            <Skeleton className="h-10 w-24" />
                            <Skeleton className="h-10 w-24" />
                        </div>

                        {/* Table */}
                        <div className="rounded-md border">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-accent border-b">
                                            <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-16" /></th>
                                            <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-24" /></th>
                                            <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-16" /></th>
                                            <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-16" /></th>
                                            <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-28" /></th>
                                            <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-16" /></th>
                                            <th className="py-3 px-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: 10 }).map((_, i) => (
                                            <tr key={i} className="border-b">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <Skeleton className="h-8 w-8 rounded-full" />
                                                        <Skeleton className="h-4 w-32" />
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                                                <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                                                <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
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

                        {/* Pagination */}
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-48" />
                            <div className="flex gap-2">
                                <Skeleton className="h-9 w-20" />
                                <Skeleton className="h-9 w-20" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
