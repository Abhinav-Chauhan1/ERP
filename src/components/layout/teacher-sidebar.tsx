"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  User,
  BookOpen,
  ClipboardCheck,
  Calendar,
  Users,
  BarChart3,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  PanelLeft,
  GraduationCap,
  School,
  Award,
  FileSpreadsheet
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
    href: "/teacher",
    icon: <GraduationCap className="h-5 w-5" />,
  },
  {
    title: "My Profile",
    href: "/teacher/profile",
    icon: <User className="h-5 w-5" />,
    submenu: [
      { title: "View Profile", href: "/teacher/profile" },
      { title: "Edit Information", href: "/teacher/profile/edit" },
      { title: "Change Password", href: "/teacher/profile/change-password" },
    ],
  },
  {
    title: "Teaching",
    href: "/teacher/teaching",
    icon: <School className="h-5 w-5" />,
    submenu: [
      { title: "My Classes", href: "/teacher/teaching/classes" },
      { title: "My Subjects", href: "/teacher/teaching/subjects" },
      { title: "Syllabus Progress", href: "/teacher/teaching/syllabus" },
      { title: "Timetable", href: "/teacher/teaching/timetable" },
    ],
  },
  {
    title: "Assessments",
    href: "/teacher/assessments",
    icon: <BookOpen className="h-5 w-5" />,
    submenu: [
      { title: "Exams", href: "/teacher/assessments/exams" },
      { title: "Assignments", href: "/teacher/assessments/assignments" },
      { title: "Results", href: "/teacher/assessments/results" },
    ],
  },
  {
    title: "Attendance",
    href: "/teacher/attendance",
    icon: <ClipboardCheck className="h-5 w-5" />,
    submenu: [
      { title: "Mark Attendance", href: "/teacher/attendance/mark" },
      { title: "View Records", href: "/teacher/attendance/records" },
      { title: "Reports", href: "/teacher/attendance/reports" },
    ],
  },
  {
    title: "Students",
    href: "/teacher/students",
    icon: <Users className="h-5 w-5" />,
    submenu: [
      { title: "Class-wise Students", href: "/teacher/students" },
      { title: "Student Profiles", href: "/teacher/students/profiles" },
      { title: "Performance", href: "/teacher/students/performance" },
    ],
  },
  {
    title: "Schedule",
    href: "/teacher/schedule",
    icon: <Calendar className="h-5 w-5" />,
    submenu: [
      { title: "My Timetable", href: "/teacher/schedule" },
      { title: "Create Lesson", href: "/teacher/schedule/create-lesson" },
      { title: "Lesson Plans", href: "/teacher/schedule/lesson-plans" },
    ],
  },
  {
    title: "Academics",
    href: "/teacher/academics",
    icon: <Award className="h-5 w-5" />,
    submenu: [
      { title: "Syllabus Management", href: "/teacher/academics/syllabus" },
      { title: "Learning Materials", href: "/teacher/academics/materials" },
      { title: "Resources", href: "/teacher/academics/resources" },
    ],
  },
  {
    title: "Communication",
    href: "/teacher/communication",
    icon: <MessageSquare className="h-5 w-5" />,
    submenu: [
      { title: "Messages", href: "/teacher/communication/messages" },
      { title: "Parent Meetings", href: "/teacher/communication/parent-meetings" },
      { title: "Announcements", href: "/teacher/communication/announcements" },
    ],
  },
  {
    title: "Documents",
    href: "/teacher/documents",
    icon: <FileText className="h-5 w-5" />,
    submenu: [
      { title: "My Documents", href: "/teacher/documents" },
      { title: "Upload Document", href: "/teacher/documents/upload" },
      { title: "Shared Documents", href: "/teacher/documents/shared" },
    ],
  },
  {
    title: "Settings",
    href: "/teacher/settings",
    icon: <Settings className="h-5 w-5" />,
    submenu: [
      { title: "Notification Preferences", href: "/teacher/settings/notifications" },
      { title: "Theme Settings", href: "/teacher/settings/theme" },
      { title: "Help & Support", href: "/teacher/settings/help" },
    ],
  },
];

export function TeacherSidebar() {
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
          <Link href="/teacher" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">
              T
            </div>
            <span className="font-semibold text-lg">Teacher Portal</span>
          </Link>
        )}
        {isCollapsed && (
          <Link href="/teacher" className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-md bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">
              T
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
                      isActive(item.href) ? "bg-emerald-50 text-emerald-700" : "text-gray-700 hover:bg-gray-100"
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
                              ? "bg-emerald-50 text-emerald-700"
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
                    isActive(item.href) ? "bg-emerald-50 text-emerald-700" : "text-gray-700 hover:bg-gray-100"
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
              <p className="text-sm font-medium">Sarah Johnson</p>
              <p className="text-xs text-gray-500">Mathematics Teacher</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
