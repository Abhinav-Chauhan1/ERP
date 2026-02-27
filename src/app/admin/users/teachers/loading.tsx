import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonUserTable } from "@/components/shared/loading/skeleton-user-table";

export default function TeachersLoading() {
    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Card */}
            <Card>
                <CardHeader className="py-4">
                    <CardTitle className="text-xl">
                        <Skeleton className="h-6 w-32" />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <SkeletonUserTable rows={10} showAvatar={true} />
                </CardContent>
            </Card>
        </div>
    );
}
