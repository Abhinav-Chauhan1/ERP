import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { SuperAdminSidebar } from "@/components/super-admin/layout/super-admin-sidebar";
import { SuperAdminHeader } from "@/components/super-admin/layout/super-admin-header";
import { SuperAdminThemeProvider } from "@/components/super-admin/layout/super-admin-theme-provider";

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
        <SuperAdminThemeProvider>
            <div className="flex h-screen bg-black overflow-hidden relative theme-sikshamitra dark">
                {/* Sidebar */}
                <SuperAdminSidebar />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:pl-64">
                    <SuperAdminHeader />
                    <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 relative z-0 bg-black text-white">
                        {children}
                    </main>
                </div>
            </div>
        </SuperAdminThemeProvider>
    );
}
