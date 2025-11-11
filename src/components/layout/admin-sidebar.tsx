"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  href: string;
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
    href: "/admin/users",
    submenu: [
      { label: "Administrators", href: "/admin/users/administrators" },
      { label: "Teachers", href: "/admin/users/teachers" },
      { label: "Students", href: "/admin/users/students" },
      { label: "Parents", href: "/admin/users/parents" },
    ],
  },
  {
    label: "Academic",
    icon: GraduationCap,
    href: "/admin/academic",
    submenu: [
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
    href: "/admin/classes",
    submenu: [
      { label: "Class List", href: "/admin/classes" },
      { label: "Sections", href: "/admin/classes/sections" },
      { label: "Rooms", href: "/admin/classes/rooms" },
    ],
  },
  {
    label: "Teaching",
    icon: PenTool,
    href: "/admin/teaching",
    submenu: [
      { label: "Subjects", href: "/admin/teaching/subjects" },
      { label: "Lessons", href: "/admin/teaching/lessons" },
      { label: "Timetable", href: "/admin/teaching/timetable" },
    ],
  },
  {
    label: "Assessment",
    icon: BookOpen,
    href: "/admin/assessment",
    submenu: [
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
    href: "/admin/attendance",
    submenu: [
      { label: "Student Attendance", href: "/admin/attendance/students" },
      { label: "Teacher Attendance", href: "/admin/attendance/teachers" },
      { label: "Reports", href: "/admin/attendance/reports" },
    ],
  },
  {
    label: "Finance",
    icon: CreditCard,
    href: "/admin/finance",
    submenu: [
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
    href: "/admin/communication",
    submenu: [
      { label: "Announcements", href: "/admin/communication/announcements" },
      { label: "Messages", href: "/admin/communication/messages" },
      { label: "Notifications", href: "/admin/communication/notifications" },
      { label: "Parent Meetings", href: "/admin/communication/parent-meetings" },
    ],
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
    href: "/admin/reports",
    submenu: [
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
  
  return (
    <div className="h-full border-r flex flex-col overflow-y-auto bg-white shadow-sm">
      <div className="p-6 flex items-center gap-2">
        <Link href="/admin">
          <h1 className="text-xl font-bold">School ERP</h1>
          <p className="text-xs text-muted-foreground">Admin Portal</p>
        </Link>
      </div>
      <div className="flex flex-col w-full">
        {routes.map((route) => {
          // Check if this route or any of its submenu items is active
          const isMainRouteActive = pathname === route.href;
          const isSubRouteActive = route.submenu?.some(item => pathname === item.href);
          const isRouteActive = isMainRouteActive || isSubRouteActive;
          
          // Show submenu when on any page within this section
          const showSubmenu = route.submenu && pathname.startsWith(route.href);
          
          return (
            <div key={route.href}>
              <Link
                href={route.href}
                className={cn(
                  "text-sm font-medium flex items-center py-3 px-6 transition-colors",
                  isRouteActive ? 
                    "text-blue-700 bg-blue-50 border-r-4 border-blue-700" : 
                    "text-gray-600 hover:text-blue-700 hover:bg-blue-50"
                )}
              >
                <route.icon className="h-5 w-5 mr-3" />
                {route.label}
              </Link>
              
              {/* Submenu */}
              {showSubmenu && (
                <div className="ml-9 border-l pl-3 my-1">
                  {route.submenu?.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "text-xs flex items-center py-2 px-2 rounded transition-colors",
                        pathname === item.href ? 
                          "text-blue-700 font-medium" : 
                          "text-gray-600 hover:text-blue-700"
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
          <span className="text-sm font-medium">Admin Account</span>
        </div>
      </div>
    </div>
  );
}
