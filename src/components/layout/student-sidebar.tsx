"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  User, BookOpen, FileText,
  BarChart2, Clock, DollarSign, MessageSquare,
  FolderOpen, Award, CalendarDays, Settings,
  GraduationCap,
  LucideIcon,
  ChevronDown, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton } from "@/components/auth/user-button";
import { SchoolLogo } from "@/components/shared/school-logo";

interface SubMenuItem {
  label: string;
  href: string;
}

interface RouteItem {
  label: string;
  icon: LucideIcon;
  href: string;
  submenu?: SubMenuItem[];
}

const routes: RouteItem[] = [
  {
    label: "Dashboard",
    icon: User,
    href: "/student",
  },
  {
    label: "Academics",
    icon: BookOpen,
    href: "/student/academics",
    submenu: [
      { label: "Class Schedule", href: "/student/academics/schedule" },
      { label: "Subjects", href: "/student/academics/subjects" },
      { label: "Curriculum", href: "/student/academics/curriculum" },
      { label: "Learning Materials", href: "/student/academics/materials" },
    ]
  },
  {
    label: "Courses",
    icon: GraduationCap,
    href: "/student/courses",
  },
  {
    label: "Assessments",
    icon: FileText,
    href: "/student/assessments",
    submenu: [
      { label: "Upcoming Exams", href: "/student/assessments/exams" },
      { label: "Exam Results", href: "/student/assessments/results" },
      { label: "Assignments", href: "/student/assessments/assignments" },
      { label: "Report Cards", href: "/student/assessments/report-cards" },
    ]
  },
  {
    label: "Performance",
    icon: BarChart2,
    href: "/student/performance",
    submenu: [
      { label: "Overview", href: "/student/performance/overview" },
      { label: "Subject Analysis", href: "/student/performance/subjects" },
      { label: "Progress Trends", href: "/student/performance/trends" },
      { label: "Class Rank", href: "/student/performance/rank" },
    ]
  },
  {
    label: "Attendance",
    icon: Clock,
    href: "/student/attendance",
    submenu: [
      { label: "My Attendance", href: "/student/attendance/report" },
      { label: "Leave Applications", href: "/student/attendance/leave" },
    ]
  },
  {
    label: "Fees",
    icon: DollarSign,
    href: "/student/fees",
    submenu: [
      { label: "Fee Details", href: "/student/fees/details" },
      { label: "Payment History", href: "/student/fees/payments" },
      { label: "Due Payments", href: "/student/fees/due" },
      { label: "Scholarships", href: "/student/fees/scholarships" },
    ]
  },
  {
    label: "Communication",
    icon: MessageSquare,
    href: "/student/communication",
    submenu: [
      { label: "Messages", href: "/student/communication/messages" },
      { label: "Announcements", href: "/student/communication/announcements" },
      { label: "Notifications", href: "/student/communication/notifications" },
    ]
  },
  {
    label: "Documents",
    icon: FolderOpen,
    href: "/student/documents",
  },
  {
    label: "Achievements",
    icon: Award,
    href: "/student/achievements",
  },
  {
    label: "Calendar",
    icon: CalendarDays,
    href: "/student/calendar",
  },
  {
    label: "Events",
    icon: CalendarDays,
    href: "/student/events",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/student/settings",
  },
];

export function StudentSidebar() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // Initialize open sections based on current pathname
  const toggleSection = (label: string) => {
    setOpenSections(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  // Auto-open section if current path matches
  const isSectionOpen = (route: RouteItem) => {
    if (!route.submenu) return false;

    // Check if manually toggled
    if (openSections[route.label] !== undefined) {
      return openSections[route.label];
    }

    // Auto-open if current path is within this section
    const basePath = route.submenu[0]?.href.split('/').slice(0, 3).join('/');
    return pathname.startsWith(basePath);
  };

  return (
    <div className="h-full border-r flex flex-col overflow-y-auto bg-card shadow-sm">
      <div className="p-4 md:p-6">
        <Link href="/student">
          <SchoolLogo showName={true} />
          <p className="text-xs text-muted-foreground mt-1">Student Portal</p>
        </Link>
      </div>
      <div className="flex flex-col w-full pb-4">
        {routes.map((route) => {
          const hasSubmenu = route.submenu && route.submenu.length > 0;
          const isOpen = isSectionOpen(route);

          // Check if this route or any of its submenu items is active
          const isMainRouteActive = pathname === route.href;
          const isSubRouteActive = route.submenu?.some(item => pathname === item.href);
          const isRouteActive = isMainRouteActive || isSubRouteActive;

          return (
            <div key={route.label}>
              {/* Main heading - clickable only if no submenu, otherwise just toggle */}
              {hasSubmenu ? (
                <button
                  onClick={() => toggleSection(route.label)}
                  className={cn(
                    "w-full text-sm md:text-base font-medium flex items-center justify-between py-3 md:py-3 px-4 md:px-6 transition-colors min-h-[44px]",
                    isRouteActive ?
                      "text-primary bg-primary/10" :
                      "text-muted-foreground hover:text-primary hover:bg-accent active:bg-accent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <route.icon className="h-5 w-5 md:h-5 md:w-5 flex-shrink-0" />
                    <span>{route.label}</span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  )}
                </button>
              ) : (
                <Link
                  href={route.href}
                  className={cn(
                    "text-sm md:text-base font-medium flex items-center py-3 md:py-3 px-4 md:px-6 transition-colors min-h-[44px]",
                    isMainRouteActive ?
                      "text-primary bg-primary/10 border-r-4 border-primary" :
                      "text-muted-foreground hover:text-primary hover:bg-accent active:bg-accent"
                  )}
                >
                  <route.icon className="h-5 w-5 md:h-5 md:w-5 mr-3 flex-shrink-0" />
                  <span>{route.label}</span>
                </Link>
              )}

              {/* Submenu */}
              {hasSubmenu && isOpen && (
                <div className="ml-8 md:ml-9 border-l pl-3 my-1">
                  {route.submenu?.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "text-xs md:text-sm flex items-center py-2.5 md:py-2 px-2 rounded transition-colors min-h-[40px]",
                        pathname === item.href ?
                          "text-primary font-medium bg-primary/10" :
                          "text-muted-foreground hover:text-primary hover:bg-accent active:bg-accent"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-auto p-4 border-t">
        <div className="flex items-center gap-x-2">
          <UserButton afterSignOutUrl="/login" />
          <span className="text-xs md:text-sm font-medium">Student Account</span>
        </div>
      </div>
    </div>
  );
}
