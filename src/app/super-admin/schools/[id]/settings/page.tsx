import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { ArrowLeft, Shield, Database, Users, Bell, Key } from "lucide-react";
import { SchoolPermissionsManager } from "@/components/super-admin/schools/school-permissions-manager";
import { SchoolUsageLimits } from "@/components/super-admin/schools/school-usage-limits";
import { SchoolNotificationSettings } from "@/components/super-admin/schools/school-notification-settings";
import { SchoolSecuritySettings } from "@/components/super-admin/schools/school-security-settings";
import { SchoolDataManagement } from "@/components/super-admin/schools/school-data-management";

interface SchoolSettingsPageProps {
    params: Promise<{ id: string }>;
}

export default async function SchoolSettingsPage({ params }: SchoolSettingsPageProps) {
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
        select: {
            id: true,
            name: true,
            schoolCode: true,
            status: true,
            plan: true,
        },
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

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/super-admin/schools/${school.id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">School Settings</h1>
                    <p className="text-muted-foreground">{school.name} • {school.schoolCode}</p>
                </div>
                <div className="ml-auto">
                    <Badge variant={school.status === "ACTIVE" ? "default" : "destructive"}>
                        {school.status}
                    </Badge>
                </div>
            </div>

            <Tabs defaultValue="permissions" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="permissions" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Permissions
                    </TabsTrigger>
                    <TabsTrigger value="limits" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Usage Limits
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Notifications
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="data" className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Data
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="permissions" className="space-y-6">
                    <SchoolPermissionsManager schoolId={school.id} />
                </TabsContent>

                <TabsContent value="limits" className="space-y-6">
                    <SchoolUsageLimits schoolId={school.id} plan={school.plan} />
                </TabsContent>

                <TabsContent value="notifications" className="space-y-6">
                    <SchoolNotificationSettings schoolId={school.id} />
                </TabsContent>

                <TabsContent value="security" className="space-y-6">
                    <SchoolSecuritySettings schoolId={school.id} />
                </TabsContent>

                <TabsContent value="data" className="space-y-6">
                    <SchoolDataManagement schoolId={school.id} />
                </TabsContent>
            </Tabs>
        </div>
    );
}