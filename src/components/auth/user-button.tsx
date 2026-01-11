"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Settings, User } from "lucide-react";

interface UserButtonProps {
  afterSignOutUrl?: string;
}

/**
 * UserButton Component
 * 
 * Replacement for Clerk's UserButton component
 * Displays user avatar and dropdown menu with profile options
 */
export function UserButton({ afterSignOutUrl = "/login" }: UserButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const initials = user.name
    ? user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  // Determine the base path from current route
  const getBasePath = () => {
    if (pathname.startsWith("/admin")) return "/admin";
    if (pathname.startsWith("/teacher")) return "/teacher";
    if (pathname.startsWith("/student")) return "/student";
    if (pathname.startsWith("/parent")) return "/parent";
    if (pathname.startsWith("/alumni")) return "/alumni";
    return "";
  };

  const basePath = getBasePath();
  
  // Only student and alumni have profile pages
  const hasProfilePage = basePath === "/student" || basePath === "/alumni";

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push(afterSignOutUrl);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative h-8 w-8 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image || undefined} alt={user.name || user.email} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {basePath && (
          <DropdownMenuItem onClick={() => router.push(`${basePath}/settings`)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        )}
        {hasProfilePage && (
          <DropdownMenuItem onClick={() => router.push(`${basePath}/profile`)}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
