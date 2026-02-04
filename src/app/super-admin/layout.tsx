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
        <div className="theme-sikshamitra min-h-screen bg-[hsl(var(--background))]">
            {/* Sidebar */}
            <SuperAdminSidebar />

            {/* Main Content Area */}
            <div className="lg:pl-64 min-h-screen">
                <SuperAdminHeader />
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
