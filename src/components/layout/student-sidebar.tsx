"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  User, BookOpen, Calendar, FileText, 
  BarChart2, Clock, DollarSign, MessageSquare, 
  FolderOpen, Award, CalendarDays, Settings 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";

const routes = [
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
    label: "Assessments",
    icon: FileText,
    href: "/student/assessments",
    submenu: [
      { label: "Upcoming Exams", href: "/student/assessments/exams" },
      { label: "Past Results", href: "/student/assessments/results" },
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
        {routes.map((route) => (
          <div key={route.href}>
            <Link
              href={route.href}
              className={cn(
                "text-sm font-medium flex items-center py-3 px-6 transition-colors",
                pathname === route.href ? 
                  "text-blue-700 bg-blue-50 border-r-4 border-blue-700" : 
                  "text-gray-600 hover:text-blue-700 hover:bg-blue-50"
              )}
            >
              <route.icon className="h-5 w-5 mr-3" />
              {route.label}
            </Link>
            
            {/* Submenu */}
            {route.submenu && pathname.startsWith(route.href) && (
              <div className="ml-9 border-l pl-3 my-1">
                {route.submenu.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "text-xs block py-2 px-2 rounded transition-colors",
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
        ))}
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
