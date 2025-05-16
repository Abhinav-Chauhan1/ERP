"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { UserRole } from "@prisma/client";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export default function RoleGuard({ 
  children, 
  allowedRoles, 
  redirectTo = "/" 
}: RoleGuardProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    // Get user's role from Clerk metadata
    const userRole = (user.publicMetadata?.role as UserRole) || null;

    if (!userRole || !allowedRoles.includes(userRole)) {
      router.push(redirectTo);
      return;
    }

    setIsAuthorized(true);
    setIsChecking(false);
  }, [user, isLoaded, allowedRoles, redirectTo, router]);

  if (isChecking) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
    </div>;
  }

  return isAuthorized ? <>{children}</> : null;
}
