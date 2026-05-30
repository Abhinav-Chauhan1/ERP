import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { SuperAdminSidebar } from "@/components/super-admin/layout/super-admin-sidebar";
import { SuperAdminHeader } from "@/components/super-admin/layout/super-admin-header";

export default async function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    try {
        await requireSuperAdminAccess();
    } catch {
        redirect("/");
    }

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <SuperAdminSidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:pl-64">
                <SuperAdminHeader />
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
