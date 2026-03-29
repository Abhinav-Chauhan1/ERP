import type { Metadata } from "next";
import { UserThemeWrapper } from "@/components/layout/user-theme-wrapper";

export const metadata: Metadata = {
  title: "Student Portal | SikshaMitra",
  description: "Access your academic dashboard, attendance, timetable, and assignments through the SikshaMitra Student Portal.",
  openGraph: {
    title: "Student Portal | SikshaMitra",
    description: "Access your academic dashboard through the SikshaMitra Student Portal.",
    type: "website",
  },
};
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

  // RBAC: Only STUDENT, ADMIN, and SUPER_ADMIN can access student routes
  const allowedRoles = ["STUDENT", "ADMIN", "SUPER_ADMIN"];
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/dashboard");
  }

  // Parallel fetch permissions, school, and student data for better performance
  const schoolId = session.user.schoolId;
  
  const [permissions, school, student] = await Promise.all([
    getUserPermissionNamesCached(session.user.id),
    schoolId ? prisma.school.findUnique({
      where: { id: schoolId },
      select: { name: true, logo: true }
    }) : Promise.resolve(null),
    prisma.student.findUnique({
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
    })
  ]);

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
