import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { EnhancedSchoolManagement } from "@/components/super-admin/schools/enhanced-school-management";

export default async function SchoolsPage() {
    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Schools</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manage all registered schools on the platform</p>
                </div>
                <Button asChild size="sm">
                    <Link href="/super-admin/schools/create">
                        <Plus className="h-4 w-4 mr-1.5" />
                        Add School
                    </Link>
                </Button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                    <EnhancedSchoolManagement />
                </Suspense>
            </div>
        </div>
    );
}
