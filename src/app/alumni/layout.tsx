/**
 * Alumni Portal Layout
 * 
 * Provides navigation and layout structure for the alumni portal.
 * Includes sidebar navigation with links to dashboard, profile, and directory.
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.7
 */

import { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import {
  LayoutDashboard,
  User,
  Users,
  Calendar,
  BookOpen,
  LogOut,
  Menu,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AlumniLayoutProps {
  children: ReactNode;
}

/**
 * Navigation items for alumni portal
 */
const navigationItems = [
  {
    title: "Dashboard",
    href: "/alumni/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Profile",
    href: "/alumni/profile",
    icon: User,
  },
  {
    title: "Alumni Directory",
    href: "/alumni/directory",
    icon: Users,
  },
  {
    title: "Events & Reunions",
    href: "/alumni/events",
    icon: Calendar,
    disabled: true, // Placeholder for future implementation
  },
  {
    title: "School News",
    href: "/alumni/news",
    icon: BookOpen,
    disabled: true, // Placeholder for future implementation
  },
];

/**
 * Sidebar Navigation Component
 */
function AlumniSidebar({ userName, userEmail, userAvatar }: {
  userName: string;
  userEmail: string;
  userAvatar?: string;
}) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo/Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-lg font-bold">Alumni Portal</h2>
            <p className="text-xs text-muted-foreground">SikshaMitra ERP</p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback>{getInitials(userName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{userName}</p>
            <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.disabled ? "#" : item.href}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                ${item.disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-accent hover:text-accent-foreground"
                }
              `}
              onClick={(e) => item.disabled && e.preventDefault()}
            >
              <Icon className="h-5 w-5" />
              <span>{item.title}</span>
              {item.disabled && (
                <span className="ml-auto text-xs text-muted-foreground">Soon</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <form action="/api/auth/signout" method="POST">
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start"
            size="sm"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </form>
      </div>
    </div>
  );
}

/**
 * Mobile Navigation Component
 */
function MobileNav({ userName, userEmail, userAvatar }: {
  userName: string;
  userEmail: string;
  userAvatar?: string;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <AlumniSidebar
          userName={userName}
          userEmail={userEmail}
          userAvatar={userAvatar}
        />
      </SheetContent>
    </Sheet>
  );
}

/**
 * Alumni Portal Layout Component
 */
export default async function AlumniLayout({ children }: AlumniLayoutProps) {
  // Check authentication
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user is a student (alumni are students who graduated)
  if (session.user.role !== UserRole.STUDENT) {
    redirect("/unauthorized");
  }

  // Verify user has an alumni profile
  const student = await db.student.findFirst({
    where: {
      user: {
        id: session.user.id,
      },
    },
    include: {
      user: true,
      alumni: true,
    },
  });

  // If no alumni profile exists, redirect to main student portal
  if (!student || !student.alumni) {
    redirect("/student");
  }

  const userName = `${student.user.firstName} ${student.user.lastName}`;
  const userEmail = student.user.email;
  const userAvatar = student.alumni.profilePhoto || student.user.avatar || undefined;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-card">
        <AlumniSidebar
          userName={userName}
          userEmail={userEmail}
          userAvatar={userAvatar}
        />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center gap-4 p-4 border-b bg-card">
          <MobileNav
            userName={userName}
            userEmail={userEmail}
            userAvatar={userAvatar}
          />
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-bold">Alumni Portal</h1>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
