"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Users,
  GraduationCap,
  LayoutGrid,
  BookOpen,
  ClipboardCheck,
  CreditCard,
  MessageSquare,
  FileText,
  BarChart3,
  Settings,
  School,
  PenTool,
  PartyPopper,
  Library,
  Building2,
  LucideIcon,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import { SchoolLogo } from "@/components/shared/school-logo";

interface SubMenuItem {
  label: string;
  href: string;
}

interface RouteItem {
  label: string;
  icon: LucideIcon;
  href?: string; // Optional now, as some items are just section headers
  submenu?: SubMenuItem[];
}

const routes: RouteItem[] = [
  {
    label: "Dashboard",
    icon: LayoutGrid,
    href: "/admin",
  },
  {
    label: "Users",
    icon: Users,
    submenu: [
      { label: "Overview", href: "/admin/users" },
      { label: "Administrators", href: "/admin/users/administrators" },
      { label: "Teachers", href: "/admin/users/teachers" },
      { label: "Students", href: "/admin/users/students" },
      { label: "Parents", href: "/admin/users/parents" },
    ],
  },
  {
    label: "Academic",
    icon: GraduationCap,
    submenu: [
      { label: "Overview", href: "/admin/academic" },
      { label: "Academic Years", href: "/admin/academic/academic-years" },
      { label: "Terms", href: "/admin/academic/terms" },
      { label: "Departments", href: "/admin/academic/departments" },
      { label: "Grades", href: "/admin/academic/grades" },
      { label: "Curriculum", href: "/admin/academic/curriculum" },
      { label: "Syllabus", href: "/admin/academic/syllabus" },
    ],
  },
  {
    label: "Classes",
    icon: School,
    submenu: [
      { label: "Class List", href: "/admin/classes" },
      { label: "Sections", href: "/admin/classes/sections" },
      { label: "Rooms", href: "/admin/classes/rooms" },
    ],
  },
  {
    label: "Teaching",
    icon: PenTool,
    submenu: [
      { label: "Overview", href: "/admin/teaching" },
      { label: "Subjects", href: "/admin/teaching/subjects" },
      { label: "Lessons", href: "/admin/teaching/lessons" },
      { label: "Timetable", href: "/admin/teaching/timetable" },
    ],
  },
  {
    label: "Assessment",
    icon: BookOpen,
    submenu: [
      { label: "Overview", href: "/admin/assessment" },
      { label: "Exam Types", href: "/admin/assessment/exam-types" },
      { label: "Exams", href: "/admin/assessment/exams" },
      { label: "Assignments", href: "/admin/assessment/assignments" },
      { label: "Results", href: "/admin/assessment/results" },
      { label: "Report Cards", href: "/admin/assessment/report-cards" },
    ],
  },
  {
    label: "Attendance",
    icon: ClipboardCheck,
    submenu: [
      { label: "Overview", href: "/admin/attendance" },
      { label: "Student Attendance", href: "/admin/attendance/students" },
      { label: "Teacher Attendance", href: "/admin/attendance/teachers" },
      { label: "Reports", href: "/admin/attendance/reports" },
    ],
  },
  {
    label: "Finance",
    icon: CreditCard,
    submenu: [
      { label: "Overview", href: "/admin/finance" },
      { label: "Fee Structure", href: "/admin/finance/fee-structure" },
      { label: "Payments", href: "/admin/finance/payments" },
      { label: "Scholarships", href: "/admin/finance/scholarships" },
      { label: "Payroll", href: "/admin/finance/payroll" },
      { label: "Expenses", href: "/admin/finance/expenses" },
      { label: "Budget", href: "/admin/finance/budget" },
    ],
  },
  {
    label: "Communication",
    icon: MessageSquare,
    submenu: [
      { label: "Overview", href: "/admin/communication" },
      { label: "Announcements", href: "/admin/communication/announcements" },
      { label: "Messages", href: "/admin/communication/messages" },
      { label: "Notifications", href: "/admin/communication/notifications" },
      { label: "Parent Meetings", href: "/admin/communication/parent-meetings" },
    ],
  },
  {
    label: "Library",
    icon: Library,
    submenu: [
      { label: "Overview", href: "/admin/library" },
      { label: "Books", href: "/admin/library/books" },
      { label: "Issues", href: "/admin/library/issues" },
      { label: "Reservations", href: "/admin/library/reservations" },
      { label: "Reports", href: "/admin/library/reports" },
    ],
  },
  {
    label: "Hostel",
    icon: Building2,
    submenu: [
      { label: "Overview", href: "/admin/hostel" },
      { label: "Rooms", href: "/admin/hostel/rooms" },
      { label: "Visitors", href: "/admin/hostel/visitors" },
      { label: "Fees", href: "/admin/hostel/fees" },
      { label: "Complaints", href: "/admin/hostel/complaints" },
    ],
  },
  {
    label: "Admissions",
    icon: GraduationCap,
    href: "/admin/admissions",
  },
  {
    label: "Events",
    icon: PartyPopper,
    href: "/admin/events",
  },
  {
    label: "Documents",
    icon: FileText,
    href: "/admin/documents",
  },
  {
    label: "Reports",
    icon: BarChart3,
    submenu: [
      { label: "Overview", href: "/admin/reports" },
      { label: "Academic Reports", href: "/admin/reports/academic" },
      { label: "Financial Reports", href: "/admin/reports/financial" },
      { label: "Attendance Reports", href: "/admin/reports/attendance" },
      { label: "Performance Analytics", href: "/admin/reports/performance" },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/admin/settings",
  },
];

export function AdminSidebar() {
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
        <Link href="/admin">
          <SchoolLogo showName={true} />
          <p className="text-xs text-muted-foreground mt-1">Admin Portal</p>
        </Link>
      </div>
      <div className="flex flex-col w-full pb-4">
        {routes.map((route) => {
          const hasSubmenu = route.submenu && route.submenu.length > 0;
          const isOpen = isSectionOpen(route);
          
          // Check if this route or any of its submenu items is active
          const isMainRouteActive = route.href && pathname === route.href;
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
                  href={route.href!}
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
          <span className="text-xs md:text-sm font-medium">Admin Account</span>
        </div>
      </div>
    </div>
  );
}
