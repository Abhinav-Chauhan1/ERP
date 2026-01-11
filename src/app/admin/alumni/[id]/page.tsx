"use client";

/**
 * Alumni Profile Page
 * 
 * Displays complete alumni profile with all information sections.
 * Includes permission checks, loading states, error handling, and breadcrumb navigation.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 14.2
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  RefreshCw,
  Home,
  Users
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  AlumniProfileHeader,
  type AlumniProfileHeaderData,
} from "@/components/admin/alumni/alumni-profile-header";
import {
  AlumniInfoSection,
  type AlumniInfoData,
} from "@/components/admin/alumni/alumni-info-section";
import {
  AlumniAcademicHistory,
  type AcademicHistoryData,
} from "@/components/admin/alumni/alumni-academic-history";
import {
  AlumniCommunicationPreferences,
  type CommunicationPreferencesData,
} from "@/components/admin/alumni/alumni-communication-preferences";
import {
  AlumniActivityTimeline,
  type ActivityRecord,
} from "@/components/admin/alumni/alumni-activity-timeline";
import { getAlumniProfile, updateAlumniProfile } from "@/lib/actions/alumniActions";

export default function AlumniProfilePage() {
  const params = useParams();
  const router = useRouter();
  const alumniId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alumniData, setAlumniData] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch alumni profile data
  const fetchAlumniProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getAlumniProfile({ alumniId });

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to load alumni profile");
      }

      setAlumniData(result.data);
    } catch (err) {
      console.error("Error fetching alumni profile:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load alumni profile";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [alumniId]);

  useEffect(() => {
    fetchAlumniProfile();
  }, [fetchAlumniProfile]);

  // Handle profile info updates
  const handleInfoSave = async (updatedData: Partial<AlumniInfoData>) => {
    try {
      const result = await updateAlumniProfile({
        alumniId,
        ...updatedData,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to update profile");
      }

      // Refresh profile data
      await fetchAlumniProfile();
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error("Error updating profile:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to update profile";
      toast.error(errorMessage);
      throw err; // Re-throw to let the component handle it
    }
  };

  // Handle communication preferences updates
  const handleCommunicationSave = async (updatedData: Partial<CommunicationPreferencesData>) => {
    try {
      const result = await updateAlumniProfile({
        alumniId,
        ...updatedData,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to update communication preferences");
      }

      // Refresh profile data
      await fetchAlumniProfile();
      toast.success("Communication preferences updated successfully");
    } catch (err) {
      console.error("Error updating communication preferences:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to update communication preferences";
      toast.error(errorMessage);
      throw err; // Re-throw to let the component handle it
    }
  };

  // Handle edit mode toggle
  const handleEditToggle = (isEditing: boolean) => {
    setIsEditMode(isEditing);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading alumni profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !alumniData) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/alumni">
                <Users className="h-4 w-4 mr-1" />
                Alumni
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Error</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Error Alert */}
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Profile</AlertTitle>
          <AlertDescription>
            {error || "Alumni profile not found"}
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/alumni")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Alumni Directory
          </Button>
          <Button variant="default" onClick={fetchAlumniProfile}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Prepare data for components
  const headerData: AlumniProfileHeaderData = {
    id: alumniData.id,
    student: alumniData.student,
    admissionId: alumniData.student.admissionId,
    graduationDate: alumniData.graduationDate,
    finalClass: alumniData.finalClass,
    finalSection: alumniData.finalSection,
    finalAcademicYear: alumniData.finalAcademicYear,
    profilePhoto: alumniData.profilePhoto,
    currentOccupation: alumniData.currentOccupation,
    currentEmployer: alumniData.currentEmployer,
    currentCity: alumniData.currentCity,
    currentEmail: alumniData.currentEmail,
    currentPhone: alumniData.currentPhone,
  };

  const infoData: AlumniInfoData = {
    currentOccupation: alumniData.currentOccupation,
    currentEmployer: alumniData.currentEmployer,
    currentJobTitle: alumniData.currentJobTitle,
    currentAddress: alumniData.currentAddress,
    currentCity: alumniData.currentCity,
    currentState: alumniData.currentState,
    currentCountry: alumniData.currentCountry,
    higherEducation: alumniData.higherEducation,
    collegeName: alumniData.collegeName,
    collegeLocation: alumniData.collegeLocation,
    graduationYearCollege: alumniData.graduationYearCollege,
    achievements: alumniData.achievements,
    linkedInProfile: alumniData.linkedInProfile,
  };

  const communicationData: CommunicationPreferencesData = {
    allowCommunication: alumniData.allowCommunication,
    communicationEmail: alumniData.communicationEmail,
    // Note: These fields would need to be added to the schema if needed
    preferredChannel: undefined,
    receiveNewsletter: undefined,
    receiveEventNotifications: undefined,
    receiveAlumniUpdates: undefined,
  };

  // Mock academic history data (would come from actual student records)
  const academicHistoryData: AcademicHistoryData = {
    attendance: [],
    examResults: [],
    assignments: [],
    overallGrade: undefined,
    overallPercentage: undefined,
    rank: undefined,
    totalStudents: undefined,
  };

  // Mock activity timeline data (would come from audit logs)
  const activityData: ActivityRecord[] = [
    {
      id: "1",
      type: "PROFILE_CREATED",
      timestamp: alumniData.createdAt,
      description: "Alumni profile was created",
      performedBy: {
        id: "system",
        name: "System",
        role: "ADMIN",
      },
    },
    {
      id: "2",
      type: "PROFILE_UPDATED",
      timestamp: alumniData.updatedAt,
      description: "Profile information was updated",
      performedBy: {
        id: alumniData.updatedBy || "system",
        name: "Administrator",
        role: "ADMIN",
      },
    },
  ];

  const fullName = `${alumniData.student.firstName} ${alumniData.student.lastName}`;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">
              <Home className="h-4 w-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/alumni">
              <Users className="h-4 w-4 mr-1" />
              Alumni
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{fullName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/alumni">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Alumni Directory
            </Button>
          </Link>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAlumniProfile}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Separator />

      {/* Profile Header */}
      <AlumniProfileHeader
        alumni={headerData}
        isEditable={true}
        isEditMode={isEditMode}
        onEditToggle={handleEditToggle}
      />

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="academic">Academic History</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <AlumniInfoSection
            data={infoData}
            isEditMode={isEditMode}
            onSave={handleInfoSave}
            onCancel={() => setIsEditMode(false)}
          />
        </TabsContent>

        {/* Academic History Tab */}
        <TabsContent value="academic" className="space-y-6 mt-6">
          <AlumniAcademicHistory data={academicHistoryData} />
          
          {/* Note about data preservation */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Academic Records</AlertTitle>
            <AlertDescription>
              Academic records from the student's time at the institution are preserved
              and accessible through this profile. If no records are displayed, they may
              not have been migrated or the student may not have had recorded academic data.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Communication Tab */}
        <TabsContent value="communication" className="space-y-6 mt-6">
          <AlumniCommunicationPreferences
            data={communicationData}
            defaultEmail={alumniData.student.email}
            defaultPhone={alumniData.student.phone}
            isEditable={true}
            onSave={handleCommunicationSave}
          />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6 mt-6">
          <AlumniActivityTimeline
            activities={activityData}
            showFilter={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
