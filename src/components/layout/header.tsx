"use client";

import { useState } from "react";
import { Bell, Menu, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserButton } from "@clerk/nextjs";

interface HeaderProps {
  toggleSidebar: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className="h-16 border-b bg-white flex items-center px-4 sticky top-0 z-30">
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:hidden">
        <Menu className="h-5 w-5" />
      </Button>

      <div className="ml-auto flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-[200px] md:w-[300px] pl-9 rounded-full bg-gray-50 border-gray-200 focus-visible:ring-blue-500"
          />
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden"
          onClick={() => setShowSearch(!showSearch)}
        >
          {showSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </Button>

        {showSearch && (
          <div className="absolute inset-x-0 top-16 p-4 bg-white border-b md:hidden">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full pl-9 bg-gray-50"
                autoFocus
              />
            </div>
          </div>
        )}

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </Button>

        <div className="md:hidden">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
