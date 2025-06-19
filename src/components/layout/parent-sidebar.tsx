"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Users, UserCheck, Calendar, FileText, 
  BarChart2, Clock, DollarSign, MessageSquare, 
  FolderOpen, Award, Settings, CalendarCheck,
  LucideIcon, BookOpen, School, Bell, BookOpenCheck
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
    icon: Users,
    href: "/parent",
  },
  {
    label: "My Children",
    icon: UserCheck,
    href: "/parent/children",
    submenu: [
      { label: "Overview", href: "/parent/children/overview", icon: Users },
      { label: "Academic Progress", href: "/parent/children/progress", icon: BookOpenCheck },
      { label: "Attendance", href: "/parent/children/attendance", icon: Clock },
    ]
  },
  {
    label: "Academics",
    icon: BookOpen,
    href: "/parent/academics",
    submenu: [
      { label: "Class Schedule", href: "/parent/academics/schedule", icon: Calendar },
      { label: "Subjects", href: "/parent/academics/subjects", icon: School },
      { label: "Homework", href: "/parent/academics/homework", icon: FileText },
    ]
  },
  {
    label: "Performance",
    icon: BarChart2,
    href: "/parent/performance",
    submenu: [
      { label: "Exam Results", href: "/parent/performance/results", icon: Award },
      { label: "Progress Reports", href: "/parent/performance/reports", icon: FileText },
    ]
  },
  {
    label: "Attendance",
    icon: Clock,
    href: "/parent/attendance",
  },
  {
    label: "Fees & Payments",
    icon: DollarSign,
    href: "/parent/fees",
    submenu: [
      { label: "Fee Overview", href: "/parent/fees/overview" },
      { label: "Payment History", href: "/parent/fees/history" },
      { label: "Make Payment", href: "/parent/fees/payment" },
    ]
  },
  {
    label: "Communication",
    icon: MessageSquare,
    href: "/parent/communication",
    submenu: [
      { label: "Messages", href: "/parent/communication/messages" },
      { label: "Announcements", href: "/parent/communication/announcements" },
      { label: "Notifications", href: "/parent/communication/notifications" },
    ]
  },
  {
    label: "Meetings",
    icon: CalendarCheck,
    href: "/parent/meetings",
    submenu: [
      { label: "Schedule Meeting", href: "/parent/meetings/schedule" },
      { label: "Upcoming Meetings", href: "/parent/meetings/upcoming" },
      { label: "Past Meetings", href: "/parent/meetings/history" },
    ]
  },
  {
    label: "Documents",
    icon: FolderOpen,
    href: "/parent/documents",
  },
  {
    label: "Events",
    icon: Calendar,
    href: "/parent/events",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/parent/settings",
  },
];

export function ParentSidebar() {
  const pathname = usePathname();
  
  return (
    <div className="h-full border-r flex flex-col overflow-y-auto bg-white shadow-sm">
      <div className="p-6 flex items-center gap-2">
        <Link href="/parent">
          <h1 className="text-xl font-bold">School ERP</h1>
          <p className="text-xs text-muted-foreground">Parent Portal</p>
        </Link>
      </div>
      <div className="flex flex-col w-full">
        {routes.map((route) => {
          // Check if this route or any of its submenu items is active
          const isMainRouteActive = pathname === route.href;
          const isSubRouteActive = route.submenu?.some(item => pathname === item.href);
          const isRouteActive = isMainRouteActive || isSubRouteActive;
          
          // Show submenu when on any related page
          const showSubmenu = route.submenu && (
            pathname.startsWith(route.href)
          );
          
          return (
            <div key={route.href}>
              <Link
                href={route.href}
                className={cn(
                  "text-sm font-medium flex items-center py-3 px-6 transition-colors",
                  isRouteActive ? 
                    "text-green-700 bg-green-50 border-r-4 border-green-700" : 
                    "text-gray-600 hover:text-green-700 hover:bg-green-50"
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
                          "text-green-700 font-medium" : 
                          "text-gray-600 hover:text-green-700"
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
          <span className="text-sm font-medium">Parent Account</span>
        </div>
      </div>
    </div>
  );
}
