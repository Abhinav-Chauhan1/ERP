"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  User, BookOpen, Calendar, FileText, 
  BarChart2, Clock, DollarSign, MessageSquare, 
  FolderOpen, Award, CalendarDays, Settings,
  GraduationCap, BookMarked, Library, Presentation,
  LucideIcon, CheckCircle, FileQuestion, ClipboardList, GraduationCap as GraduationCapIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";

interface SubMenuItem {
  label: string;
  href: string;
  icon?: LucideIcon;
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
      { label: "Class Schedule", href: "/student/academics/schedule", icon: Calendar },
      { label: "Subjects", href: "/student/academics/subjects", icon: Library },
      { label: "Curriculum", href: "/student/academics/curriculum", icon: BookMarked },
      { label: "Learning Materials", href: "/student/academics/materials", icon: Presentation },
    ]
  },
  {
    label: "Assessments",
    icon: FileText,
    href: "/student/assessments",
    submenu: [
      { label: "Upcoming Exams", href: "/student/assessments/exams", icon: FileQuestion },
      { label: "Exam Results", href: "/student/assessments/results", icon: BarChart2 },
      { label: "Assignments", href: "/student/assessments/assignments", icon: ClipboardList },
      { label: "Report Cards", href: "/student/assessments/report-cards", icon: GraduationCapIcon },
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
  
  return (
    <div className="h-full border-r flex flex-col overflow-y-auto bg-white shadow-sm">
      <div className="p-6 flex items-center gap-2">
        <Link href="/student">
          <h1 className="text-xl font-bold">School ERP</h1>
          <p className="text-xs text-muted-foreground">Student Portal</p>
        </Link>
      </div>
      <div className="flex flex-col w-full">
        {routes.map((route) => {
          // Check if this route or any of its submenu items is active
          const isMainRouteActive = pathname === route.href;
          const isSubRouteActive = route.submenu?.some(item => pathname === item.href);
          const isRouteActive = isMainRouteActive || isSubRouteActive;
          
          // Special handling for academics section - show submenu when on any academics page
          const showSubmenu = route.submenu && (
            pathname.startsWith(route.href) || 
            (route.label === "Academics" && pathname.startsWith("/student/academics"))
          );
          
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
                      {item.icon && <item.icon className="h-3.5 w-3.5 mr-1.5" />}
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
          <span className="text-sm font-medium">Student Account</span>
        </div>
      </div>
    </div>
  );
}
