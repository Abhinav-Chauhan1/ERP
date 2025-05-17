"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  ClipboardCheck,
  FileText,
  MessageSquare,
  ChevronRight,
  BarChart,
  Calendar,
  Clock,
  Settings,
  LogOut,
  Menu,
  User,
  FileSpreadsheet,
  PenSquare,
  School,
  ShieldCheck,
  Calculator,
  Book,
  Laptop,
  CalendarDays,
  ListChecks,
  Bell,
  BarChart2,
  Mail,
  UserCircle
} from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { useState } from "react";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  isPending?: boolean;
  isExternal?: boolean;
  children?: React.ReactNode;
}

interface NavGroupProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  toggleOpen?: () => void; // Add this line to fix the type error
}

export function TeacherSidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    teaching: true,
    assessments: true,
  });

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col h-full border-r bg-white w-64">
      <div className="p-4 border-b flex items-center justify-between">
        <Link href="/teacher">
          <div className="flex items-center gap-2">
            <School className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">School ERP</span>
          </div>
        </Link>
        <Button 
          variant="ghost" 
          size="icon"
          className="lg:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <nav className={cn(
        "flex-1 overflow-y-auto p-2",
        isMobileMenuOpen ? "block" : "hidden lg:block"
      )}>
        <div className="space-y-1">
          <NavItem
            href="/teacher"
            icon={<LayoutDashboard className="h-4 w-4 mr-2" />}
            label="Dashboard"
            isActive={pathname === "/teacher"}
          />
          
          <NavGroup 
            title="Teaching" 
            icon={<BookOpen className="h-4 w-4 mr-2" />}
            defaultOpen={openGroups.teaching}
            toggleOpen={() => toggleGroup('teaching')}
          >
            <NavItem
              href="/teacher/teaching/subjects"
              icon={<Book className="h-4 w-4 mr-2" />}
              label="Subjects"
              isActive={pathname.includes("/teacher/teaching/subjects")}
            />
            <NavItem
              href="/teacher/teaching/classes"
              icon={<Users className="h-4 w-4 mr-2" />}
              label="Classes"
              isActive={pathname.includes("/teacher/teaching/classes")}
            />
            <NavItem
              href="/teacher/teaching/lessons"
              icon={<Laptop className="h-4 w-4 mr-2" />}
              label="Lessons"
              isActive={pathname.includes("/teacher/teaching/lessons")}
            />
            <NavItem
              href="/teacher/teaching/timetable"
              icon={<CalendarDays className="h-4 w-4 mr-2" />}
              label="Timetable"
              isActive={pathname.includes("/teacher/teaching/timetable")}
            />
            <NavItem
              href="/teacher/teaching/syllabus"
              icon={<ListChecks className="h-4 w-4 mr-2" />}
              label="Syllabus"
              isActive={pathname.includes("/teacher/teaching/syllabus")}
            />
          </NavGroup>
          
          <NavGroup 
            title="Assessments" 
            icon={<FileText className="h-4 w-4 mr-2" />}
            defaultOpen={openGroups.assessments}
            toggleOpen={() => toggleGroup('assessments')}
          >
            <NavItem
              href="/teacher/assessments/assignments"
              icon={<FileSpreadsheet className="h-4 w-4 mr-2" />}
              label="Assignments"
              isActive={pathname.includes("/teacher/assessments/assignments")}
            />
            <NavItem
              href="/teacher/assessments/exams"
              icon={<PenSquare className="h-4 w-4 mr-2" />}
              label="Exams"
              isActive={pathname.includes("/teacher/assessments/exams")}
            />
            <NavItem
              href="/teacher/assessments/results"
              icon={<BarChart className="h-4 w-4 mr-2" />}
              label="Results"
              isActive={pathname.includes("/teacher/assessments/results")}
            />
          </NavGroup>

          <NavGroup 
            title="Attendance" 
            icon={<ClipboardCheck className="h-4 w-4 mr-2" />}
            defaultOpen={openGroups.attendance}
            toggleOpen={() => toggleGroup('attendance')}
          >
            <NavItem
              href="/teacher/attendance"
              icon={<Calendar className="h-4 w-4 mr-2" />}
              label="Overview"
              isActive={pathname === "/teacher/attendance"}
            />
            <NavItem
              href="/teacher/attendance/mark"
              icon={<ClipboardCheck className="h-4 w-4 mr-2" />}
              label="Mark Attendance"
              isActive={pathname.includes("/teacher/attendance/mark")}
            />
            <NavItem
              href="/teacher/attendance/reports"
              icon={<FileText className="h-4 w-4 mr-2" />}
              label="Reports"
              isActive={pathname.includes("/teacher/attendance/reports")}
            />
          </NavGroup>

          <NavGroup 
            title="Students" 
            icon={<GraduationCap className="h-4 w-4 mr-2" />}
            defaultOpen={openGroups.students}
            toggleOpen={() => toggleGroup('students')}
          >
            <NavItem
              href="/teacher/students"
              icon={<Users className="h-4 w-4 mr-2" />}
              label="Student List"
              isActive={pathname === "/teacher/students"}
            />
            <NavItem
              href="/teacher/students/performance"
              icon={<BarChart2 className="h-4 w-4 mr-2" />}
              label="Performance"
              isActive={pathname.includes("/teacher/students/performance")}
            />
          </NavGroup>
          
          <NavGroup 
            title="Communication" 
            icon={<MessageSquare className="h-4 w-4 mr-2" />}
            defaultOpen={openGroups.communication}
            toggleOpen={() => toggleGroup('communication')}
          >
            <NavItem
              href="/teacher/communication/messages"
              icon={<Mail className="h-4 w-4 mr-2" />}
              label="Messages"
              isActive={pathname.includes("/teacher/communication/messages")}
            />
            <NavItem
              href="/teacher/communication/announcements"
              icon={<Bell className="h-4 w-4 mr-2" />}
              label="Announcements"
              isActive={pathname.includes("/teacher/communication/announcements")}
            />
          </NavGroup>

          <div className="pt-2 mt-2 border-t">
            <NavItem
              href="/teacher/profile"
              icon={<UserCircle className="h-4 w-4 mr-2" />}
              label="My Profile"
              isActive={pathname.includes("/teacher/profile")}
            />
            <NavItem
              href="/teacher/settings"
              icon={<Settings className="h-4 w-4 mr-2" />}
              label="Settings"
              isActive={pathname.includes("/teacher/settings")}
            />
            <div className="px-2 mt-2">
              <SignOutButton>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </SignOutButton>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}

function NavItem({ href, icon, label, isActive, isPending, isExternal, children }: NavItemProps) {
  return (
    <Link 
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={cn(
        "flex items-center group px-2 py-2 text-sm font-medium rounded-md transition-colors",
        isActive 
          ? "bg-primary/10 text-primary hover:bg-primary/15" 
          : "text-gray-700 hover:bg-gray-100",
        isPending && "opacity-70 cursor-not-allowed"
      )}
    >
      <span className="flex items-center">
        {icon}
        {label}
      </span>
      {isExternal && <ChevronRight className="ml-auto h-4 w-4 opacity-50" />}
      {children}
    </Link>
  );
}

function NavGroup({ title, icon, children, defaultOpen = false, toggleOpen }: NavGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggleOpen = () => {
    setIsOpen(!isOpen);
    if (toggleOpen) {
      toggleOpen();
    }
  };

  return (
    <div className="mb-2">
      <button
        className="flex items-center justify-between w-full px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
        onClick={handleToggleOpen}
      >
        <span className="flex items-center">
          {icon}
          {title}
        </span>
        <ChevronRight 
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen ? "transform rotate-90" : ""
          )} 
        />
      </button>
      <div 
        className={cn(
          "ml-4 pl-2 border-l transition-all overflow-hidden",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        {children}
      </div>
    </div>
  );
}
