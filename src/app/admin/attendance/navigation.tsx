"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserCheck, Users, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const attendanceNavItems = [
  {
    title: "Student Attendance",
    href: "/admin/attendance/students",
    icon: Users,
  },
  {
    title: "Teacher Attendance",
    href: "/admin/attendance/teachers",
    icon: UserCheck,
  },
  {
    title: "Leave Applications",
    href: "/admin/attendance/leave-applications",
    icon: FileText,
  },
];

export function AttendanceNavigation() {
  const pathname = usePathname();

  return (
    <nav className="flex border-b mb-5">
      {attendanceNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center px-4 py-2 border-b-2 text-sm font-medium transition-colors",
            pathname === item.href
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <item.icon className="w-4 h-4 mr-2" />
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
