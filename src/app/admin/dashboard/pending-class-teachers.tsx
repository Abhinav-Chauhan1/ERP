import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSectionsWithoutHeadTeacher } from "@/lib/actions/classesActions";

export async function PendingClassTeachersSection() {
    const result = await getSectionsWithoutHeadTeacher();
    const pendingAssignments = (result.success && result.data) ? result.data : [];

    if (pendingAssignments.length === 0) {
        return null;
    }

    // Show top 5
    const displayItems = pendingAssignments.slice(0, 5);

    return (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-900">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                    <AlertCircle className="h-5 w-5" />
                    <CardTitle className="text-base font-medium">Pending Class Teacher Assignments</CardTitle>
                </div>
                <CardDescription>
                    {pendingAssignments.length} sections are missing a Head Class Teacher.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {displayItems.map((item: any) => (
                        <div key={`${item.classId}-${item.sectionId}`} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-md border text-sm">
                            <div className="font-medium">
                                {item.className} - Section {item.sectionName}
                            </div>
                            <Link href={`/admin/classes/${item.classId}`}>
                                <Button size="sm" variant="outline" className="h-7 text-xs">
                                    Assign
                                    <ArrowRight className="ml-1 h-3 w-3" />
                                </Button>
                            </Link>
                        </div>
                    ))}
                    {pendingAssignments.length > 5 && (
                        <div className="text-center pt-2">
                            <Link href="/admin/classes">
                                <Button variant="link" size="sm" className="text-orange-600">
                                    View all {pendingAssignments.length} pending
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
