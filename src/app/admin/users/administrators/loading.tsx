import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonUserTable } from "@/components/shared/loading/skeleton-user-table";

export default function AdministratorsLoading() {
    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <Skeleton className="h-8 w-40 mb-2" />
                    <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>

            {/* Card */}
            <Card>
                <CardHeader className="py-4">
                    <CardTitle className="text-xl">
                        <Skeleton className="h-6 w-40" />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <SkeletonUserTable rows={10} showAvatar={true} />
                </CardContent>
            </Card>
        </div>
    );
}
