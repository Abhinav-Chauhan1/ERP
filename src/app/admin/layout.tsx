import { UserThemeWrapper } from "@/components/layout/user-theme-wrapper";
import { AdminSidebar, AdminHeader } from "@/components/layout/portal-wrappers";
import { getUserPermissionNamesCached } from "@/lib/utils/permissions";
import { PermissionsProvider } from "@/context/permissions-context";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { getSchoolPlan } from "@/lib/server/get-school-plan";

export default async function AdminLayout({
  children
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // RBAC: Only ADMIN and SUPER_ADMIN can access admin routes
  const allowedRoles = ["ADMIN", "SUPER_ADMIN"];
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/dashboard");
  }

  // Redirect Super Admin to their own dashboard if they hit the root /admin
  // unless they are explicitly viewing a school context (which we'd handle differently later)
  if (session.user.role === "SUPER_ADMIN" && !session.user.schoolId) {
    redirect("/super-admin");
  }

  // Parallel fetch permissions and school plan for better performance
  const [permissions, schoolPlanInfo] = await Promise.all([
    getUserPermissionNamesCached(session.user.id),
    session.user.schoolId ? getSchoolPlan(session.user.schoolId) : Promise.resolve(null)
  ]);

  const schoolPlan = schoolPlanInfo?.plan ?? 'STARTER'

  return (
    <PermissionsProvider permissions={permissions}>
      <UserThemeWrapper userRole="admin">
        <nav
          className="hidden md:flex h-full w-72 flex-col fixed inset-y-0 z-50"
          aria-label="Admin navigation"
        >
          <AdminSidebar userPermissions={permissions} schoolPlan={schoolPlan} />
        </nav>
        <div className="md:pl-72 h-full">
          <AdminHeader userPermissions={permissions} />
          <main
            id="main-content"
            className="h-[calc(100%-4rem)] overflow-y-auto bg-background p-4 md:p-6"
            tabIndex={-1}
            aria-label="Main content"
          >
            {children}
          </main>
        </div>
      </UserThemeWrapper>
    </PermissionsProvider>
  );
}
