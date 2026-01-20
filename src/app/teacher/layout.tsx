import { UserThemeWrapper } from "@/components/layout/user-theme-wrapper";
import { TeacherSidebar, TeacherHeader } from "@/components/layout/portal-wrappers";
import { getUserPermissionNamesCached } from "@/lib/utils/permissions";
import { PermissionsProvider } from "@/context/permissions-context";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function TeacherLayout({
  children
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get effective permissions including role defaults and DB overrides
  const permissions = await getUserPermissionNamesCached(session.user.id);

  return (
    <PermissionsProvider permissions={permissions}>
      <UserThemeWrapper userRole="teacher">
        <nav
          className="hidden md:flex h-full w-72 flex-col fixed inset-y-0 z-50"
          aria-label="Teacher navigation"
        >
          <TeacherSidebar userPermissions={permissions} />
        </nav>
        <div className="md:pl-72 h-full">
          <TeacherHeader userPermissions={permissions} />
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
