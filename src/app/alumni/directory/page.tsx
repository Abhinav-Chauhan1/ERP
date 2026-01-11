export const dynamic = 'force-dynamic';

/**
 * Alumni Directory Page (Alumni Portal)
 * 
 * Displays other alumni with privacy controls for the alumni portal.
 * Respects privacy settings and provides search functionality.
 * 
 * Requirements: 12.7
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { AlumniDirectoryView } from "@/components/alumni/alumni-directory-view";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Alumni Directory - Alumni Portal",
  description: "Connect with fellow alumni",
};

/**
 * Loading component for alumni directory
 */
function AlumniDirectoryLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Privacy Notice Skeleton */}
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>

      {/* Search Card Skeleton */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Skeleton */}
      <Skeleton className="h-4 w-48" />

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-3">
                <Skeleton className="h-20 w-20 rounded-full" />
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
 * Fetch alumni directory data
 */
async function getAlumniDirectoryData(currentUserId: string) {
  // Find the current user's alumni profile
  const currentStudent = await db.student.findFirst({
    where: {
      user: {
        id: currentUserId,
      },
    },
    include: {
      alumni: true,
    },
  });

  if (!currentStudent || !currentStudent.alumni) {
    return null;
  }

  // Fetch all alumni who allow communication (respecting privacy)
  // In a real implementation, this would also check individual privacy settings
  const alumni = await db.alumni.findMany({
    where: {
      allowCommunication: true,
    },
    include: {
      student: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      graduationDate: "desc",
    },
  });

  // Format alumni data with privacy controls
  const formattedAlumni = alumni.map((alumnus) => ({
    id: alumnus.id,
    studentName: `${alumnus.student.user.firstName} ${alumnus.student.user.lastName}`,
    admissionId: alumnus.student.admissionId,
    graduationDate: alumnus.graduationDate,
    finalClass: alumnus.finalClass,
    finalSection: alumnus.finalSection,
    currentOccupation: alumnus.currentOccupation || undefined,
    currentEmployer: alumnus.currentEmployer || undefined,
    currentCity: alumnus.currentCity || undefined,
    currentState: alumnus.currentState || undefined,
    currentEmail: alumnus.currentEmail || alumnus.student.user.email,
    collegeName: alumnus.collegeName || undefined,
    higherEducation: alumnus.higherEducation || undefined,
    profilePhoto: alumnus.profilePhoto || alumnus.student.user.avatar || undefined,
    allowCommunication: alumnus.allowCommunication,
    // Privacy settings (in a real implementation, these would come from a privacy settings table)
    showEmail: alumnus.allowCommunication,
    showPhone: false, // Default to private
    showAddress: false, // Default to private
    showOccupation: true, // Default to public
  }));

  return {
    alumni: formattedAlumni,
    currentAlumniId: currentStudent.alumni.id,
  };
}

/**
 * Alumni Directory Content Component
 */
async function AlumniDirectoryContent() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get directory data
  const directoryData = await getAlumniDirectoryData(session.user.id);

  if (!directoryData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-2xl font-bold">Alumni Profile Not Found</h2>
        <p className="text-muted-foreground text-center max-w-md">
          We couldn't find an alumni profile associated with your account.
          Please contact the administration if you believe this is an error.
        </p>
      </div>
    );
  }

  return (
    <AlumniDirectoryView
      alumni={directoryData.alumni}
      currentAlumniId={directoryData.currentAlumniId}
    />
  );
}

/**
 * Alumni Directory Page Component
 * 
 * Handles authentication, authorization, and renders the alumni directory.
 * Only accessible to users with STUDENT role who have an alumni profile.
 */
export default async function AlumniDirectoryPage() {
  // Check authentication
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user is a student (alumni are students who graduated)
  if (session.user.role !== UserRole.STUDENT) {
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
