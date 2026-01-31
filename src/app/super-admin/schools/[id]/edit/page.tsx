import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SchoolEditForm } from "@/components/super-admin/schools/school-edit-form";

export default async function EditSchoolPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    try {
        await requireSuperAdminAccess();
    } catch (error) {
        redirect("/");
    }

    const school = await db.school.findUnique({
        where: { id },
    });

    if (!school) {
        return (
            <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[50vh]">
                <h1 className="text-2xl font-bold mb-4">School Not Found</h1>
                <p className="text-gray-500 mb-6">The school you are looking for does not exist.</p>
                <Button asChild>
                    <Link href="/super-admin/schools">Return to Schools List</Link>
                </Button>
            </div>
        );
    }

    // Transform school to match expected interface
    const transformedSchool = {
        ...school,
        status: school.status === 'DEACTIVATED' ? 'INACTIVE' : school.status as 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/super-admin/schools/${school.id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Edit School</h1>
                    <p className="text-muted-foreground">{school.name} • {school.schoolCode}</p>
                </div>
            </div>

            <SchoolEditForm school={transformedSchool} />
        </div>
    );
}
