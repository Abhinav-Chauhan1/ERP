import { UserThemeWrapper } from "@/components/layout/user-theme-wrapper";
import { getUserPermissionNamesCached } from "@/lib/utils/permissions";
import { PermissionsProvider } from "@/context/permissions-context";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { MobileBottomNavigation, MobileBottomNavigationSpacer } from "@/components/navigation/mobile-bottom-navigation";
import { ResponsiveSidebarNavigation, SidebarContentWrapper } from "@/components/navigation/responsive-sidebar-navigation";
import { prisma } from "@/lib/db";

export default async function StudentLayout({
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

  // Fetch school information from the database
  const schoolId = session.user.schoolId;
  const school = schoolId ? await prisma.school.findUnique({
    where: { id: schoolId },
    select: { name: true, logo: true }
  }) : null;

  // Get student's class information from active enrollment
  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      enrollments: {
        where: { status: 'ACTIVE' },
        include: {
          class: { select: { name: true } },
          section: { select: { name: true } }
        },
        take: 1,
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  const activeEnrollment = student?.enrollments[0];
  const studentClass = activeEnrollment
    ? `${activeEnrollment.class.name}${activeEnrollment.section ? ` ${activeEnrollment.section.name}` : ''}`
    : 'Student';

  return (
    <PermissionsProvider permissions={permissions}>
      <UserThemeWrapper userRole="student">
        {/* Mobile-First Navigation System */}
        <ResponsiveSidebarNavigation
          className={studentClass}
          schoolName={school?.name}
          schoolLogo={school?.logo}
        />

        <SidebarContentWrapper className={studentClass}>
          {/* Mobile-optimized header - simplified for mobile */}
          <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 md:hidden">
            <div className="flex items-center gap-3 p-4">
              {school?.logo && (
                <img
                  src={school.logo}
                  alt={`${school.name || 'School'} logo`}
                  className="h-10 w-10 object-contain flex-shrink-0"
                />
              )}
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                {school?.name || "Student Portal"}
              </h1>
            </div>
          </header>

          {/* Main content with mobile-first padding */}
          <main
            id="main-content"
            className="min-h-screen bg-background p-4 md:p-6 pb-safe"
            tabIndex={-1}
            aria-label="Student content"
          >
            {children}

            {/* Spacer for mobile bottom navigation */}
            <MobileBottomNavigationSpacer className={studentClass} />
          </main>
        </SidebarContentWrapper>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNavigation className={studentClass} />
      </UserThemeWrapper>
    </PermissionsProvider>
  );
}
