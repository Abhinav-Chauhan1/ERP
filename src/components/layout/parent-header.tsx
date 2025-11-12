"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ParentSidebar } from "./parent-sidebar";
import { getTotalUnreadCount } from "@/lib/actions/parent-communication-actions";

interface Child {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  class: string;
  section: string;
  isPrimary: boolean;
}

export function ParentHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [notifications, setNotifications] = useState<number>(0);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [children, setChildren] = useState<Child[]>([]);

  // Fetch children data
  const fetchChildren = async () => {
    try {
      const response = await fetch("/api/parent/children");
      const data = await response.json();
      
      if (data.success && data.children) {
        setChildren(data.children);
        
        // Set selected child from URL or default to first
        const childIdFromUrl = searchParams.get("childId");
        if (childIdFromUrl && data.children.some((c: Child) => c.id === childIdFromUrl)) {
          setSelectedChild(childIdFromUrl);
        } else if (data.children.length > 0) {
          setSelectedChild(data.children[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching children:", error);
    }
  };

  // Fetch real notifications count from database
  const fetchNotificationsCount = async () => {
    try {
      const result = await getTotalUnreadCount();
      if (result.success && result.data) {
        setNotifications(result.data.total);
      }
    } catch (error) {
      console.error("Error fetching notifications count:", error);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchChildren();
    fetchNotificationsCount();

    // Refresh notifications count every 30 seconds
    const interval = setInterval(fetchNotificationsCount, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // Update selected child when URL changes
  useEffect(() => {
    const childIdFromUrl = searchParams.get("childId");
    if (childIdFromUrl && children.some(c => c.id === childIdFromUrl)) {
      setSelectedChild(childIdFromUrl);
    }
  }, [searchParams, children]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-2 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <ParentSidebar />
          </SheetContent>
        </Sheet>
        <Link href="/parent" className="md:hidden">
          <h1 className="text-xl font-bold">School ERP</h1>
        </Link>
      </div>

      <div className="hidden md:flex items-center space-x-4">
        <h1 className="text-xl font-semibold">
          {pathname === "/parent" && "Dashboard"}
          {pathname.startsWith("/parent/children") && "My Children"}
          {pathname.startsWith("/parent/academics") && "Academics"}
          {pathname.startsWith("/parent/performance") && "Performance"}
          {pathname.startsWith("/parent/attendance") && "Attendance"}
          {pathname.startsWith("/parent/fees") && "Fees & Payments"}
          {pathname.startsWith("/parent/communication") && "Communication"}
          {pathname.startsWith("/parent/meetings") && "Meetings"}
          {pathname.startsWith("/parent/documents") && "Documents"}
          {pathname.startsWith("/parent/events") && "Events"}
          {pathname.startsWith("/parent/settings") && "Settings"}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {children.length > 0 && (
          <Select 
            value={selectedChild} 
            onValueChange={(value) => {
              setSelectedChild(value);
              
              // Update URL with childId for relevant pages
              if (pathname.includes('/parent/performance') || 
                  pathname.includes('/parent/fees') || 
                  pathname.includes('/parent/academics') ||
                  pathname.includes('/parent/documents')) {
                const newSearchParams = new URLSearchParams(searchParams.toString());
                newSearchParams.set('childId', value);
                router.push(`${pathname}?${newSearchParams.toString()}`);
              }
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              {children.map(child => (
                <SelectItem key={child.id} value={child.id}>
                  {child.name} - {child.class}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        <Button 
          variant="outline" 
          size="icon" 
          className="relative"
          onClick={() => router.push("/parent/communication/notifications")}
        >
          <Bell className="h-5 w-5" />
          {notifications > 0 && (
            <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
              {notifications > 99 ? "99+" : notifications}
            </Badge>
          )}
        </Button>
        <UserButton afterSignOutUrl="/login" />
      </div>
    </div>
  );
}
