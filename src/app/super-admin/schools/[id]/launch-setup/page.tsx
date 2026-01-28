import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

export default async function LaunchSetupPage({ params }: { params: Promise<{ id: string }> }) {
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
        redirect("/super-admin/schools");
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/super-admin/schools`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold">Setup School: {school.name}</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Launch Setup Wizard</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-600">
                        This school has not completed its onboarding setup.
                    </p>

                    <div className="p-4 border border-blue-200 bg-blue-50 rounded text-blue-800">
                        <h3 className="font-semibold mb-2">How to complete setup:</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Log out and log in as the School Administrator for this school.</li>
                            <li>You will be automatically redirected to the Setup Wizard.</li>
                        </ul>
                    </div>

                    <div className="pt-4">
                        <Button asChild variant="outline">
                            <Link href="/login" target="_blank">
                                Open Login Page <ExternalLink className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
