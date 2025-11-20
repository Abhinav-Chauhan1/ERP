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
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";

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
    label: "Assessments",
    icon: FileText,
    submenu: [
      { label: "Assignments", href: "/teacher/assessments/assignments" },
      { label: "Exams", href: "/teacher/assessments/exams" },
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
      <div className="p-6 flex items-center gap-2">
        <Link href="/teacher">
          <h1 className="text-xl font-bold">School ERP</h1>
          <p className="text-xs text-muted-foreground">Teacher Portal</p>
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
                    "w-full text-sm font-medium flex items-center justify-between py-3 px-6 transition-colors",
                    isRouteActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-primary hover:bg-accent"
                  )}
                >
                  <span className="flex items-center">
                    <route.icon className="h-5 w-5 mr-3" />
                    {route.label}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isOpen ? "transform rotate-180" : ""
                    )}
                  />
                </button>

                {/* Submenu */}
                {isOpen && (
                  <div className="ml-9 border-l pl-3 my-1">
                    {route.submenu.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "text-xs flex items-center py-2 px-2 rounded transition-colors",
                          pathname === item.href
                            ? "text-primary font-medium bg-primary/10"
                            : "text-muted-foreground hover:text-primary hover:bg-accent"
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
                "text-sm font-medium flex items-center py-3 px-6 transition-colors",
                isRouteActive
                  ? "text-primary bg-primary/10 border-r-4 border-primary"
                  : "text-muted-foreground hover:text-primary hover:bg-accent"
              )}
            >
              <route.icon className="h-5 w-5 mr-3" />
              {route.label}
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
