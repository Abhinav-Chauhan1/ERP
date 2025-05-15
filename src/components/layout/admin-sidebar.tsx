"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  GraduationCap,
  LayoutGrid,
  BookOpen,
  ClipboardCheck,
  Calendar,
  CreditCard,
  MessageSquare,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  PanelLeft,
  CalendarDays,
  School,
  PenTool,
  Bell,
  PartyPopper
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

type SidebarItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  submenu?: { title: string; href: string }[];
};

const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: <LayoutGrid className="h-5 w-5" />,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: <Users className="h-5 w-5" />,
    submenu: [
      { title: "Administrators", href: "/admin/users/administrators" },
      { title: "Teachers", href: "/admin/users/teachers" },
      { title: "Students", href: "/admin/users/students" },
      { title: "Parents", href: "/admin/users/parents" },
    ],
  },
  {
    title: "Academic",
    href: "/admin/academic",
    icon: <GraduationCap className="h-5 w-5" />,
    submenu: [
      { title: "Academic Years", href: "/admin/academic/academic-years" },
      { title: "Terms", href: "/admin/academic/terms" },
      { title: "Departments", href: "/admin/academic/departments" },
      { title: "Grades", href: "/admin/academic/grades" },
      { title: "Curriculum", href: "/admin/academic/curriculum" },
      { title: "Syllabus", href: "/admin/academic/syllabus" },
    ],
  },
  {
    title: "Classes",
    href: "/admin/classes",
    icon: <School className="h-5 w-5" />,
    submenu: [
      { title: "Class List", href: "/admin/classes" },
      { title: "Sections", href: "/admin/classes/sections" },
      { title: "Rooms", href: "/admin/classes/rooms" },
    ],
  },
  {
    title: "Teaching",
    href: "/admin/teaching",
    icon: <PenTool className="h-5 w-5" />,
    submenu: [
      { title: "Subjects", href: "/admin/teaching/subjects" },
      { title: "Lessons", href: "/admin/teaching/lessons" },
      { title: "Timetable", href: "/admin/teaching/timetable" },
    ],
  },
  {
    title: "Assessment",
    href: "/admin/assessment",
    icon: <BookOpen className="h-5 w-5" />,
    submenu: [
      { title: "Exam Types", href: "/admin/assessment/exam-types" },
      { title: "Exams", href: "/admin/assessment/exams" },
      { title: "Assignments", href: "/admin/assessment/assignments" },
      { title: "Results", href: "/admin/assessment/results" },
      { title: "Report Cards", href: "/admin/assessment/report-cards" },
    ],
  },
  {
    title: "Attendance",
    href: "/admin/attendance",
    icon: <ClipboardCheck className="h-5 w-5" />,
    submenu: [
      { title: "Student Attendance", href: "/admin/attendance/students" },
      { title: "Teacher Attendance", href: "/admin/attendance/teachers" },
      { title: "Reports", href: "/admin/attendance/reports" },
    ],
  },
  {
    title: "Finance",
    href: "/admin/finance",
    icon: <CreditCard className="h-5 w-5" />,
    submenu: [
      { title: "Fee Structure", href: "/admin/finance/fee-structure" },
      { title: "Payments", href: "/admin/finance/payments" },
      { title: "Scholarships", href: "/admin/finance/scholarships" },
      { title: "Payroll", href: "/admin/finance/payroll" },
      { title: "Expenses", href: "/admin/finance/expenses" },
      { title: "Budget", href: "/admin/finance/budget" },
    ],
  },
  {
    title: "Communication",
    href: "/admin/communication",
    icon: <MessageSquare className="h-5 w-5" />,
    submenu: [
      { title: "Announcements", href: "/admin/communication/announcements" },
      { title: "Messages", href: "/admin/communication/messages" },
      { title: "Notifications", href: "/admin/communication/notifications" },
      { title: "Parent Meetings", href: "/admin/communication/parent-meetings" },
    ],
  },
  {
    title: "Events",
    href: "/admin/events",
    icon: <PartyPopper className="h-5 w-5" />,
  },
  {
    title: "Documents",
    href: "/admin/documents",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: <BarChart3 className="h-5 w-5" />,
    submenu: [
      { title: "Academic Reports", href: "/admin/reports/academic" },
      { title: "Financial Reports", href: "/admin/reports/financial" },
      { title: "Attendance Reports", href: "/admin/reports/attendance" },
      { title: "Performance Analytics", href: "/admin/reports/performance" },
    ],
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: <Settings className="h-5 w-5" />,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
      setIsCollapsed(window.innerWidth < 1024);
    };
    
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-white border-r transition-all duration-300",
        isCollapsed ? "w-[70px]" : "w-[280px]"
      )}
    >
      <div className="flex items-center h-16 px-4 border-b">
        {!isCollapsed && (
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              S
            </div>
            <span className="font-semibold text-lg">School ERP</span>
          </Link>
        )}
        {isCollapsed && (
          <Link href="/admin" className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              S
            </div>
          </Link>
        )}
        {!isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto"
          >
            <PanelLeft className={cn("h-4 w-4 transition-all", isCollapsed ? "rotate-180" : "")} />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-auto py-2">
        <nav className="space-y-1 px-2">
          {sidebarItems.map((item) => (
            <div key={item.title}>
              {item.submenu ? (
                <div className="mb-1">
                  <button
                    onClick={() => toggleSubmenu(item.title)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive(item.href) ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    {item.icon}
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left">{item.title}</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`h-4 w-4 transition-transform ${openSubmenus[item.title] ? "rotate-180" : ""}`}
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </>
                    )}
                  </button>
                  
                  {(openSubmenus[item.title] || isActive(item.href)) && !isCollapsed && (
                    <div className="mt-1 pl-10 space-y-1">
                      {item.submenu.map((subitem) => (
                        <Link
                          key={subitem.href}
                          href={subitem.href}
                          className={cn(
                            "block px-3 py-2 rounded-md text-sm transition-colors",
                            pathname === subitem.href
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-600 hover:bg-gray-100"
                          )}
                        >
                          {subitem.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors mb-1",
                    isActive(item.href) ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {item.icon}
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t p-4">
        <div className="flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />
          {!isCollapsed && (
            <div className="flex-1">
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-gray-500">admin@school.com</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
