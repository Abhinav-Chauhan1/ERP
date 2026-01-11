export const dynamic = 'force-dynamic';

/**
 * Alumni Directory Page
 * 
 * Main page for browsing and managing alumni profiles.
 * Integrates AlumniDirectory component with server-side data fetching.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 14.2
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { AlumniDirectoryContent } from "./alumni-directory-content";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const metadata = {
  title: "Alumni Directory - SikshaMitra",
  description: "Browse and manage alumni profiles",
};

/**
 * Loading component for alumni directory
 */
function AlumniDirectoryLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Search Card Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <Skeleton className="h-10 flex-1" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Skeleton */}
      <Skeleton className="h-4 w-48" />

      {/* Cards Grid Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <Skeleton className="h-24 w-24 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Alumni Directory Page Component
 * 
 * Handles authentication, authorization, and renders the alumni directory.
 */
export default async function AlumniDirectoryPage() {
  // Check authentication
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Check authorization - only ADMIN and TEACHER can access
  if (![UserRole.ADMIN, UserRole.TEACHER].includes(session.user.role)) {
    redirect("/unauthorized");
  }

  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<AlumniDirectoryLoading />}>
        <AlumniDirectoryContent />
      </Suspense>
    </div>
  );
}
