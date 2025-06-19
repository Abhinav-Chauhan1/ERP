"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle2, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ParentHeaderProps {
  parent: any;
  children: any[];
  onChildChange?: (childId: string) => void;
}

export function ParentHeader({ parent, children, onChildChange }: ParentHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [selectedChild, setSelectedChild] = useState<string>(
    children.length > 0 ? children[0].id : ""
  );
  
  // If a childId query parameter exists in the URL, use that
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const childId = searchParams.get('childId');
    
    if (childId && children.some(child => child.id === childId)) {
      setSelectedChild(childId);
    }
  }, [children]);
  
  const handleChildChange = (value: string) => {
    setSelectedChild(value);
    
    if (onChildChange) {
      onChildChange(value);
    }
    
    // If we're on specific child-related pages, update the URL
    if (pathname.includes('/parent/performance') || 
        pathname.includes('/parent/fees') || 
        pathname.includes('/parent/academics')) {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('childId', value);
      router.push(`${pathname}?${searchParams.toString()}`);
    }
  };
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {parent.user?.firstName || 'Parent'}!</h1>
        <p className="text-gray-500">Access your children's academic information</p>
      </div>
      
      {children.length > 0 && (
        <div className="flex items-center gap-2 bg-white p-2 rounded-md border">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none">
              <Avatar className="h-8 w-8">
                {children.find(child => child.id === selectedChild)?.user?.avatar ? (
                  <AvatarImage 
                    src={children.find(child => child.id === selectedChild)?.user?.avatar} 
                    alt="Selected child" 
                  />
                ) : (
                  <AvatarFallback>
                    {(children.find(child => child.id === selectedChild)?.user?.firstName || "").charAt(0)}
                    {(children.find(child => child.id === selectedChild)?.user?.lastName || "").charAt(0)}
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="font-medium">
                {children.find(child => child.id === selectedChild)?.user?.firstName || "Select Child"}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Select a child</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {children.map(child => (
                <DropdownMenuItem 
                  key={child.id} 
                  onClick={() => handleChildChange(child.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={child.user.avatar} alt={child.user.firstName} />
                      <AvatarFallback>
                        {child.user.firstName.charAt(0)}{child.user.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 truncate">
                      <span className="font-medium">
                        {child.user.firstName} {child.user.lastName}
                      </span>
                      <p className="text-xs text-gray-500">
                        {child.enrollments.length > 0 
                          ? child.enrollments[0].class.name 
                          : "No class"
                        }
                      </p>
                    </div>
                    {child.isPrimary && (
                      <span className="text-xs bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded">
                        Primary
                      </span>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/parent/children/overview" className="cursor-pointer">
                  View All Children
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
