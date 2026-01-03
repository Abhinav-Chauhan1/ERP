"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  ClipboardCheck,
  FileText,
  MessageSquare,
  Settings,
  ChevronDown,
  ChevronRight,
  LucideIcon,
  Video,
  FolderOpen,
  Award,
  CalendarDays,
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
  href?: string;
  submenu?: SubMenuItem[];
}

const routes: RouteItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/teacher",
  },
  {
    label: "Teaching",
    icon: BookOpen,
    submenu: [
      { label: "Subjects", href: "/teacher/teaching/subjects" },
      { label: "Classes", href: "/teacher/teaching/classes" },
      { label: "Lessons", href: "/teacher/teaching/lessons" },
      { label: "Timetable", href: "/teacher/teaching/timetable" },
      { label: "Syllabus", href: "/teacher/teaching/syllabus" },
    ],
  },
  {
    label: "Courses",
    icon: Video,
    href: "/teacher/courses",
  },
  {
    label: "Assessments",
    icon: FileText,
    submenu: [
      { label: "Assignments", href: "/teacher/assessments/assignments" },
      { label: "Exams", href: "/teacher/assessments/exams" },
      { label: "Online Exams", href: "/teacher/assessments/online-exams" },
      { label: "Question Bank", href: "/teacher/assessments/question-bank" },
      { label: "Results", href: "/teacher/assessments/results" },
    ],
  },
  {
    label: "Attendance",
    icon: ClipboardCheck,
    submenu: [
      { label: "Overview", href: "/teacher/attendance" },
      { label: "Mark Attendance", href: "/teacher/attendance/mark" },
      { label: "Reports", href: "/teacher/attendance/reports" },
    ],
  },
  {
    label: "Students",
    icon: GraduationCap,
    submenu: [
      { label: "Student List", href: "/teacher/students" },
      { label: "Performance", href: "/teacher/students/performance" },
    ],
  },
  {
    label: "Documents",
    icon: FolderOpen,
    href: "/teacher/documents",
  },
  {
    label: "Calendar",
    icon: CalendarDays,
    href: "/teacher/calendar",
  },
  {
    label: "Achievements",
    icon: Award,
    href: "/teacher/achievements",
  },
  {
    label: "Communication",
    icon: MessageSquare,
    submenu: [
      { label: "Messages", href: "/teacher/communication/messages" },
      { label: "Announcements", href: "/teacher/communication/announcements" },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/teacher/settings",
  },
];

export function TeacherSidebar() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  // Initialize open menus based on current path
  const initializeOpenMenus = () => {
    const initialState: Record<string, boolean> = {};
    routes.forEach((route) => {
      if (route.submenu) {
        const isActive = route.submenu.some(item => pathname.startsWith(item.href.split('?')[0]));
        initialState[route.label] = isActive;
      }
    });
    return initialState;
  };

  // Set initial state on mount
  if (Object.keys(openMenus).length === 0) {
    setOpenMenus(initializeOpenMenus());
  }

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  return (
    <div className="h-full border-r flex flex-col overflow-y-auto bg-card shadow-sm">
      <div className="p-4 md:p-6">
        <Link href="/teacher">
          <SchoolLogo showName={true} />
          <p className="text-xs text-muted-foreground mt-1">Teacher Portal</p>
        </Link>
      </div>
      <div className="flex flex-col w-full">
        {routes.map((route) => {
          // Check if any submenu item is active
          const isSubRouteActive = route.submenu?.some(item => pathname === item.href);
          const isRouteActive = route.href ? pathname === route.href : isSubRouteActive;
          const isOpen = openMenus[route.label];

          // If route has submenu, render as button
          if (route.submenu) {
            return (
              <div key={route.label}>
                <button
                  onClick={() => toggleMenu(route.label)}
                  className={cn(
                    "w-full text-sm md:text-base font-medium flex items-center justify-between py-3 px-4 md:px-6 transition-colors min-h-[44px]",
                    isRouteActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-primary hover:bg-accent active:bg-accent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <route.icon className="h-5 w-5 flex-shrink-0" />
                    <span>{route.label}</span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  )}
                </button>

                {/* Submenu */}
                {isOpen && (
                  <div className="ml-8 md:ml-9 border-l pl-3 my-1">
                    {route.submenu.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "text-xs md:text-sm flex items-center py-2.5 md:py-2 px-2 rounded transition-colors min-h-[40px]",
                          pathname === item.href
                            ? "text-primary font-medium bg-primary/10"
                            : "text-muted-foreground hover:text-primary hover:bg-accent active:bg-accent"
                        )}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // Regular link without submenu
          return (
            <Link
              key={route.href}
              href={route.href!}
              className={cn(
                "text-sm md:text-base font-medium flex items-center py-3 px-4 md:px-6 transition-colors min-h-[44px]",
                isRouteActive
                  ? "text-primary bg-primary/10 border-r-4 border-primary"
                  : "text-muted-foreground hover:text-primary hover:bg-accent active:bg-accent"
              )}
            >
              <route.icon className="h-5 w-5 mr-3 flex-shrink-0" />
              <span>{route.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="mt-auto p-4 border-t">
        <div className="flex items-center gap-x-2">
          <UserButton afterSignOutUrl="/login" />
          <span className="text-sm font-medium">Teacher Account</span>
        </div>
      </div>
    </div>
  );
}
