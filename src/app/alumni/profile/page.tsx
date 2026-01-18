export const dynamic = 'force-dynamic';

/**
 * Alumni Profile Page
 * 
 * Self-service profile editor for alumni users to update their information.
 * Includes form validation, photo upload, and restricts editing to allowed fields.
 * 
 * Requirements: 12.2, 12.3, 12.4
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { AlumniProfileEditor } from "@/components/alumni/alumni-profile-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { updateAlumniProfile } from "@/lib/actions/alumniActions";
import { uploadBufferToCloudinary } from "@/lib/cloudinary-server";

export const metadata = {
  title: "My Profile - Alumni Portal",
  description: "Update your alumni profile information",
};

/**
 * Loading component for alumni profile
 */
function AlumniProfileLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Profile Cards Skeleton */}
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Fetch alumni profile data
 */
async function getAlumniProfileData(userId: string) {
  // Find the student record for this user
  const student = await db.student.findFirst({
    where: {
      user: {
        id: userId,
      },
    },
    include: {
      user: true,
      alumni: true,
    },
  });

  if (!student || !student.alumni) {
    return null;
  }

  const alumni = student.alumni;

  // Parse achievements if available
  let achievements: string[] = [];
  if (alumni.achievements) {
    try {
      achievements = JSON.parse(alumni.achievements);
    } catch (error) {
      console.error("Failed to parse achievements:", error);
    }
  }

  return {
    alumniId: alumni.id,
    initialData: {
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      admissionId: student.admissionId,
      graduationDate: alumni.graduationDate,
      finalClass: alumni.finalClass,
      finalSection: alumni.finalSection,
      currentOccupation: alumni.currentOccupation || undefined,
      currentEmployer: alumni.currentEmployer || undefined,
      currentJobTitle: alumni.currentJobTitle || undefined,
      currentPhone: alumni.currentPhone || student.user.phone || undefined,
      currentEmail: alumni.currentEmail || student.user.email,
      currentAddress: alumni.currentAddress || undefined,
      currentCity: alumni.currentCity || undefined,
      currentState: alumni.currentState || undefined,
      currentCountry: alumni.currentCountry || "India",
      higherEducation: alumni.higherEducation || undefined,
      collegeName: alumni.collegeName || undefined,
      collegeLocation: alumni.collegeLocation || undefined,
      graduationYearCollege: alumni.graduationYearCollege || undefined,
      achievements,
      linkedInProfile: alumni.linkedInProfile || undefined,
      profilePhoto: alumni.profilePhoto || student.user.avatar || undefined,
      allowCommunication: alumni.allowCommunication,
      communicationEmail: alumni.communicationEmail || undefined,
    },
  };
}

/**
 * Handle profile save
 */
async function handleProfileSave(alumniId: string, data: any) {
  "use server";
  
  try {
    const result = await updateAlumniProfile({
      alumniId,
      ...data,
    });

    return result;
  } catch (error) {
    console.error("Error saving profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save profile",
    };
  }
}

/**
 * Handle photo upload
 */
export async function handlePhotoUpload(file: File) {
  "use server";
  
  try {
    if (!file) {
      throw new Error("No file provided");
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      throw new Error("File must be an image");
    }

    // Validate file size (5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error("File size must be less than 5MB");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    // Using a specific folder for alumni profiles to keep things organized
    const result = await uploadBufferToCloudinary(buffer, {
      folder: "alumni-profiles",
      resource_type: "image",
    });

    return {
      success: true,
      url: result.secure_url,
    };
  } catch (error) {
    console.error("Error uploading photo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload photo",
    };
  }
}

/**
 * Alumni Profile Content Component
 */
async function AlumniProfileContent() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get profile data
  const profileData = await getAlumniProfileData(session.user.id);

  if (!profileData) {
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
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-2">
          Update your information to stay connected with your alma mater
        </p>
      </div>

      {/* Profile Editor */}
      <AlumniProfileEditor
        alumniId={profileData.alumniId}
        initialData={profileData.initialData}
        onSave={async (data) => {
          "use server";
          return await handleProfileSave(profileData.alumniId, data);
        }}
        onPhotoUpload={async (file) => {
          "use server";
          return await handlePhotoUpload(file);
        }}
      />
    </div>
  );
}

/**
 * Alumni Profile Page Component
 * 
 * Handles authentication, authorization, and renders the alumni profile editor.
 * Only accessible to users with STUDENT role who have an alumni profile.
 */
export default async function AlumniProfilePage() {
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
      <Suspense fallback={<AlumniProfileLoading />}>
        <AlumniProfileContent />
      </Suspense>
    </div>
  );
}
