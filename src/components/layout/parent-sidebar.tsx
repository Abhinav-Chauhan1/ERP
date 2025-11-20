"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { 
  Users, UserCheck, Calendar, FileText, 
  BarChart2, Clock, DollarSign, MessageSquare, 
  FolderOpen, Award, Settings, CalendarCheck,
  LucideIcon, BookOpen, School, Bell, BookOpenCheck,
  ChevronDown, ChevronRight
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
  href?: string; // Optional now - headings without href are non-clickable
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
    submenu: [
      { label: "Overview", href: "/parent/children", icon: Users },
      { label: "Academic Progress", href: "/parent/children/progress", icon: BookOpenCheck },
      { label: "Attendance", href: "/parent/children/attendance", icon: Clock },
    ]
  },
  {
    label: "Academics",
    icon: BookOpen,
    submenu: [
      { label: "Overview", href: "/parent/academics", icon: BookOpen },
      { label: "Class Schedule", href: "/parent/academics/schedule", icon: Calendar },
      { label: "Subjects", href: "/parent/academics/subjects", icon: School },
      { label: "Homework", href: "/parent/academics/homework", icon: FileText },
    ]
  },
  {
    label: "Performance",
    icon: BarChart2,
    submenu: [
      { label: "Overview", href: "/parent/performance", icon: BarChart2 },
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
    submenu: [
      { label: "Overview", href: "/parent/fees", icon: DollarSign },
      { label: "Payment History", href: "/parent/fees/history" },
      { label: "Make Payment", href: "/parent/fees/payment" },
    ]
  },
  {
    label: "Communication",
    icon: MessageSquare,
    submenu: [
      { label: "Overview", href: "/parent/communication", icon: MessageSquare },
      { label: "Messages", href: "/parent/communication/messages" },
      { label: "Announcements", href: "/parent/communication/announcements" },
      { label: "Notifications", href: "/parent/communication/notifications" },
    ]
  },
  {
    label: "Meetings",
    icon: CalendarCheck,
    submenu: [
      { label: "Overview", href: "/parent/meetings", icon: CalendarCheck },
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
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  
  // Initialize open menus based on current path
  const isMenuOpen = (route: RouteItem) => {
    if (openMenus[route.label] !== undefined) {
      return openMenus[route.label];
    }
    // Auto-open if current path matches any submenu item
    return route.submenu?.some(item => pathname === item.href) || false;
  };
  
  const toggleMenu = (label: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };
  
  return (
    <div className="h-full border-r flex flex-col overflow-y-auto bg-card shadow-sm">
      <div className="p-6 flex items-center gap-2">
        <Link href="/parent">
          <h1 className="text-xl font-bold">School ERP</h1>
          <p className="text-xs text-muted-foreground">Parent Portal</p>
        </Link>
      </div>
      <div className="flex flex-col w-full">
        {routes.map((route) => {
          // Check if any submenu items are active
          const isSubRouteActive = route.submenu?.some(item => pathname === item.href);
          const isMainRouteActive = route.href && pathname === route.href;
          const isRouteActive = isMainRouteActive || isSubRouteActive;
          
          const showSubmenu = route.submenu && isMenuOpen(route);
          
          return (
            <div key={route.label}>
              {route.href ? (
                <Link
                  href={route.href}
                  className={cn(
                    "text-sm font-medium flex items-center py-3 px-6 transition-colors",
                    isRouteActive ? 
                      "text-primary bg-primary/10 border-r-4 border-primary" : 
                      "text-muted-foreground hover:text-primary hover:bg-accent"
                  )}
                >
                  <route.icon className="h-5 w-5 mr-3" />
                  {route.label}
                </Link>
              ) : (
                <button
                  onClick={() => toggleMenu(route.label)}
                  className={cn(
                    "w-full text-sm font-medium flex items-center justify-between py-3 px-6 transition-colors cursor-pointer",
                    isRouteActive ? 
                      "text-primary bg-primary/10" : 
                      "text-muted-foreground hover:text-primary hover:bg-accent"
                  )}
                >
                  <div className="flex items-center">
                    <route.icon className="h-5 w-5 mr-3" />
                    {route.label}
                  </div>
                  {route.submenu && (
                    showSubmenu ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
              
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
                          "text-primary font-medium bg-primary/10" : 
                          "text-muted-foreground hover:text-primary hover:bg-accent"
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
