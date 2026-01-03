"use client";

import { useSession } from "next-auth/react";
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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated" || !session?.user) {
      router.push("/login");
      return;
    }

    // Get user's role from session
    const userRole = session.user.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      router.push(redirectTo);
      return;
    }

    setIsAuthorized(true);
    setIsChecking(false);
  }, [session, status, allowedRoles, redirectTo, router]);

  if (isChecking) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
    </div>;
  }

  return isAuthorized ? <>{children}</> : null;
}
