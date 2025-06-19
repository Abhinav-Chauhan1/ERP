"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

export function ParentHeader() {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<number>(0);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedChild, setSelectedChild] = useState<string>("");
  
  // Mock data for children
  const children = [
    { id: "1", name: "John Smith", grade: "Grade 9" },
    { id: "2", name: "Sarah Smith", grade: "Grade 6" }
  ];

  // Simulate fetching notifications count
  useEffect(() => {
    setIsMounted(true);
    // This would be replaced with an actual API call
    setNotifications(2);
    
    // Set first child as default
    if (children.length > 0) {
      setSelectedChild(children[0].id);
    }
  }, []);

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
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              {children.map(child => (
                <SelectItem key={child.id} value={child.id}>
                  {child.name} - {child.grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        <Link href="/parent/communication/notifications">
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {notifications > 0 && (
              <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
                {notifications}
              </Badge>
            )}
          </Button>
        </Link>
        <UserButton afterSignOutUrl="/login" />
      </div>
    </div>
  );
}
