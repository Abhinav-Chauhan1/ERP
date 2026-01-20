import { UnifiedSidebar } from "@/components/layout/unified-sidebar";
import { UnifiedHeader } from "@/components/layout/unified-header";
import { UserThemeWrapper } from "@/components/layout/user-theme-wrapper";
import { adminSidebarConfig, adminHeaderConfig } from "@/components/layout/sidebar-routes";
import { auth } from "@/auth";
import { getUserPermissionNamesCached } from "@/lib/utils/permissions";
import { PermissionsProvider } from "@/context/permissions-context";

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  // Fetch user permissions if logged in
  let userPermissions: string[] = [];
  if (userId) {
    userPermissions = await getUserPermissionNamesCached(userId);
  }

  return (
    <PermissionsProvider permissions={userPermissions}>
      <UserThemeWrapper userRole="admin">
        <nav
          className="hidden md:flex h-full w-72 flex-col fixed inset-y-0 z-50"
          aria-label="Admin navigation"
        >
          <UnifiedSidebar config={adminSidebarConfig} userPermissions={userPermissions} />
        </nav>
        <div className="md:pl-72 h-full">
          <UnifiedHeader
            headerConfig={adminHeaderConfig}
            sidebarConfig={adminSidebarConfig}
            userPermissions={userPermissions}
          />
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
