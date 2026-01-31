"use server";

/**
 * Alumni Server Actions
 * 
 * This file contains server actions for alumni management operations.
 * All actions include authentication and authorization checks.
 * 
 * Requirements: 5.1-5.7, 6.1-6.7, 7.1-7.7, 10.1-10.7, 14.2, 14.3
 */

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { UserRole, AuditAction } from "@prisma/client";
import { AlumniService } from "@/lib/services/alumniService";
import { logAudit } from "@/lib/utils/audit-log";
import { memoryCache, CACHE_DURATION } from "@/lib/utils/cache";
import {
  alumniSearchSchema,
  getAlumniProfileSchema,
  updateAlumniProfileSchema,
  generateAlumniReportSchema,
  sendAlumniMessageSchema,
  getAlumniForCommunicationSchema,
  type AlumniSearchInput,
  type GetAlumniProfileInput,
  type UpdateAlumniProfileInput,
  type GenerateAlumniReportInput,
  type SendAlumniMessageInput,
  type GetAlumniForCommunicationInput,
} from "@/lib/schemas/alumniSchemas";

// ============================================================================
// Types
// ============================================================================

export type AlumniSearchResult = {
  success: boolean;
  data?: {
    alumni: Array<{
      id: string;
      studentName: string;
      admissionId: string;
      graduationDate: Date;
      finalClass: string;
      finalSection: string;
      currentOccupation?: string;
      currentCity?: string;
      currentEmail?: string;
      profilePhoto?: string;
    }>;
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  };
  error?: string;
};

export type AlumniProfileResult = {
  success: boolean;
  data?: {
    id: string;
    student: {
      id: string;
      admissionId: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      dateOfBirth?: Date;
      gender?: string;
    };
    graduationDate: Date;
    finalClass: string;
    finalSection: string;
    finalAcademicYear: string;
    currentOccupation?: string;
    currentEmployer?: string;
    currentJobTitle?: string;
    currentAddress?: string;
    currentCity?: string;
    currentState?: string;
    currentCountry?: string;
    currentPhone?: string;
    currentEmail?: string;
    higherEducation?: string;
    collegeName?: string;
    collegeLocation?: string;
    graduationYearCollege?: number;
    achievements?: string[];
    linkedInProfile?: string;
    profilePhoto?: string;
    allowCommunication: boolean;
    communicationEmail?: string;
    createdAt: Date;
    updatedAt: Date;
  };
  error?: string;
};

export type AlumniStatisticsResult = {
  success: boolean;
  data?: {
    totalAlumni: number;
    byGraduationYear: Record<number, number>;
    byOccupation: Record<string, number>;
    byCollege: Record<string, number>;
    byCity: Record<string, number>;
  };
  error?: string;
};

export type AlumniCommunicationResult = {
  success: boolean;
  data?: {
    totalRecipients: number;
    successCount: number;
    failureCount: number;
    results: Array<{
      alumniId: string;
      alumniName: string;
      success: boolean;
      error?: string;
    }>;
  };
  error?: string;
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if user is authenticated and has appropriate role
 */
async function checkAuth(allowedRoles: UserRole[] = [UserRole.ADMIN]) {
  const session = await auth();

  if (!session?.user) {
    return { authorized: false, error: "Not authenticated", userId: null };
  }

  if (!allowedRoles.includes(session.user.role)) {
    return {
      authorized: false,
      error: `Insufficient permissions. Required roles: ${allowedRoles.join(", ")}`,
      userId: null,
    };
  }

  return { authorized: true, error: null, userId: session.user.id };
}

// ============================================================================
// Server Actions - Search and Directory
// ============================================================================

/**
 * Search and filter alumni directory
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 14.2, 14.3
 * 
 * @param input - Search filters and pagination
 * @returns Paginated alumni search results
 */
export async function searchAlumni(
  input: AlumniSearchInput
): Promise<AlumniSearchResult> {
  try {
    // Authentication and authorization check (allow ADMIN and TEACHER)
    const authCheck = await checkAuth([UserRole.ADMIN, UserRole.TEACHER]);
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error || "Unauthorized" };
    }

    // Validate input
    const validation = alumniSearchSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      };
    }

    const {
      searchTerm,
      graduationYearFrom,
      graduationYearTo,
      finalClass,
      currentCity,
      currentOccupation,
      collegeName,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = validation.data;

    // Initialize alumni service
    const alumniService = new AlumniService();

    // Generate cache key for this search query
    const cacheKey = `${alumniService.generateSearchCacheKey({
      searchTerm,
      graduationYearFrom,
      graduationYearTo,
      finalClass,
      currentCity,
      currentOccupation,
      collegeName,
    })}:page:${page}:size:${pageSize}:sort:${sortBy}:${sortOrder}`;

    // Check cache first (cache for 10 minutes)
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached,
      };
    }

    // Build search query
    const where = alumniService.buildSearchQuery({
      searchTerm,
      graduationYearFrom,
      graduationYearTo,
      finalClass,
      currentCity,
      currentOccupation,
      collegeName,
    });

    // Get total count
    const total = await db.alumni.count({ where });

    // Build order by clause
    let orderBy: any = {};
    if (sortBy === "name") {
      orderBy = {
        student: {
          user: {
            firstName: sortOrder,
          },
        },
      };
    } else if (sortBy === "graduationDate") {
      orderBy = { graduationDate: sortOrder };
    } else if (sortBy === "updatedAt") {
      orderBy = { updatedAt: sortOrder };
    }

    // Fetch alumni
    const alumni = await db.alumni.findMany({
      where,
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Format alumni data
    const formattedAlumni = alumni.map((alumnus) => ({
      id: alumnus.id,
      studentName: `${alumnus.student.user.firstName} ${alumnus.student.user.lastName}`,
      admissionId: alumnus.student.admissionId,
      graduationDate: alumnus.graduationDate,
      finalClass: alumnus.finalClass,
      finalSection: alumnus.finalSection,
      currentOccupation: alumnus.currentOccupation || undefined,
      currentCity: alumnus.currentCity || undefined,
      currentEmail: alumnus.currentEmail || alumnus.student.user.email || undefined,
      profilePhoto: alumnus.profilePhoto || alumnus.student.user.avatar || undefined,
    }));

    const resultData = {
      alumni: formattedAlumni,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };

    // Cache the results for 10 minutes
    memoryCache.set(cacheKey, resultData, CACHE_DURATION.ALUMNI * 1000);

    // Log audit event for alumni search
    await logAudit({
      userId: authCheck.userId!,
      action: AuditAction.VIEW,
      resource: "ALUMNI",
      changes: {
        operation: "SEARCH_ALUMNI",
        filters: {
          searchTerm,
          graduationYearFrom,
          graduationYearTo,
          finalClass,
          currentCity,
          currentOccupation,
          collegeName,
        },
        resultCount: formattedAlumni.length,
      },
    });

    return {
      success: true,
      data: resultData,
    };
  } catch (error) {
    console.error("Error searching alumni:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to search alumni",
    };
  }
}

/**
 * Get alumni profile by ID
 * 
 * Requirements: 5.1, 14.2, 14.3
 * 
 * @param input - Alumni ID
 * @returns Complete alumni profile
 */
export async function getAlumniProfile(
  input: GetAlumniProfileInput
): Promise<AlumniProfileResult> {
  try {
    // Authentication and authorization check (allow ADMIN and TEACHER)
    const authCheck = await checkAuth([UserRole.ADMIN, UserRole.TEACHER]);
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error || "Unauthorized" };
    }

    // Validate input
    const validation = getAlumniProfileSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      };
    }

    const { alumniId } = validation.data;

    // Fetch alumni profile
    const alumnus = await db.alumni.findUnique({
      where: { id: alumniId },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!alumnus) {
      return {
        success: false,
        error: "Alumni profile not found",
      };
    }

    // Parse achievements if available
    let achievements: string[] = [];
    if (alumnus.achievements) {
      try {
        achievements = JSON.parse(alumnus.achievements);
      } catch (error) {
        console.error("Failed to parse achievements:", error);
      }
    }

    // Format alumni profile
    const profile = {
      id: alumnus.id,
      student: {
        id: alumnus.student.id,
        admissionId: alumnus.student.admissionId,
        firstName: alumnus.student.user.firstName || "",
        lastName: alumnus.student.user.lastName || "",
        email: alumnus.student.user.email || "",
        phone: alumnus.student.user.phone || alumnus.student.phone || undefined,
        dateOfBirth: alumnus.student.dateOfBirth || undefined,
        gender: alumnus.student.gender || undefined,
      },
      graduationDate: alumnus.graduationDate,
      finalClass: alumnus.finalClass,
      finalSection: alumnus.finalSection,
      finalAcademicYear: alumnus.finalAcademicYear,
      currentOccupation: alumnus.currentOccupation || undefined,
      currentEmployer: alumnus.currentEmployer || undefined,
      currentJobTitle: alumnus.currentJobTitle || undefined,
      currentAddress: alumnus.currentAddress || undefined,
      currentCity: alumnus.currentCity || undefined,
      currentState: alumnus.currentState || undefined,
      currentCountry: alumnus.currentCountry || undefined,
      currentPhone: alumnus.currentPhone || undefined,
      currentEmail: alumnus.currentEmail || undefined,
      higherEducation: alumnus.higherEducation || undefined,
      collegeName: alumnus.collegeName || undefined,
      collegeLocation: alumnus.collegeLocation || undefined,
      graduationYearCollege: alumnus.graduationYearCollege || undefined,
      achievements,
      linkedInProfile: alumnus.linkedInProfile || undefined,
      profilePhoto: alumnus.profilePhoto || undefined,
      allowCommunication: alumnus.allowCommunication,
      communicationEmail: alumnus.communicationEmail || undefined,
      createdAt: alumnus.createdAt,
      updatedAt: alumnus.updatedAt,
    };

    // Log audit event for viewing alumni profile
    await logAudit({
      userId: authCheck.userId!,
      action: AuditAction.VIEW,
      resource: "ALUMNI",
      resourceId: alumniId,
      changes: {
        operation: "VIEW_ALUMNI_PROFILE",
      },
    });

    return {
      success: true,
      data: profile,
    };
  } catch (error) {
    console.error("Error fetching alumni profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch alumni profile",
    };
  }
}

// ============================================================================
// Server Actions - Profile Management
// ============================================================================

/**
 * Update alumni profile
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 * 
 * @param input - Alumni profile update data
 * @returns Updated alumni profile
 */
export async function updateAlumniProfile(
  input: UpdateAlumniProfileInput
): Promise<AlumniProfileResult> {
  try {
    // Authentication and authorization check (ADMIN only for updates)
    const authCheck = await checkAuth([UserRole.ADMIN]);
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error || "Unauthorized" };
    }

    // Validate input
    const validation = updateAlumniProfileSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      };
    }

    const { alumniId, ...updateData } = validation.data;

    // Check if alumni exists
    const existingAlumni = await db.alumni.findUnique({
      where: { id: alumniId },
    });

    if (!existingAlumni) {
      return {
        success: false,
        error: "Alumni profile not found",
      };
    }

    // Initialize alumni service for validation
    const alumniService = new AlumniService();

    // Validate profile update
    const validationResult = alumniService.validateProfileUpdate(updateData);
    if (!validationResult.valid) {
      return {
        success: false,
        error: validationResult.errors.join(", "),
      };
    }

    // Prepare update data
    const updatePayload: any = {
      ...updateData,
      updatedBy: authCheck.userId,
      updatedAt: new Date(),
    };

    // Convert achievements array to JSON string if provided
    if (updateData.achievements) {
      updatePayload.achievements = JSON.stringify(updateData.achievements);
    }

    // Update alumni profile
    const updatedAlumni = await db.alumni.update({
      where: { id: alumniId },
      data: updatePayload,
    });

    // Log audit event for alumni profile update
    await logAudit({
      userId: authCheck.userId!,
      action: AuditAction.UPDATE,
      resource: "ALUMNI",
      resourceId: alumniId,
      changes: {
        operation: "PROFILE_UPDATE",
        updatedFields: Object.keys(updateData),
        before: {
          currentOccupation: existingAlumni.currentOccupation,
          currentEmployer: existingAlumni.currentEmployer,
          currentCity: existingAlumni.currentCity,
          collegeName: existingAlumni.collegeName,
        },
        after: {
          currentOccupation: updatedAlumni.currentOccupation,
          currentEmployer: updatedAlumni.currentEmployer,
          currentCity: updatedAlumni.currentCity,
          collegeName: updatedAlumni.collegeName,
        },
      },
    });

    // Invalidate alumni cache
    alumniService.invalidateCache(alumniId);

    // Revalidate paths
    revalidatePath("/admin/alumni");
    revalidatePath(`/admin/alumni/${alumniId}`);

    // Fetch and return updated profile
    return await getAlumniProfile({ alumniId });
  } catch (error) {
    console.error("Error updating alumni profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update alumni profile",
    };
  }
}

// ============================================================================
// Server Actions - Statistics and Reporting
// ============================================================================

/**
 * Get alumni statistics
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.7
 * 
 * @returns Alumni statistics
 */
export async function getAlumniStatistics(): Promise<AlumniStatisticsResult> {
  try {
    // Authentication and authorization check
    const authCheck = await checkAuth([UserRole.ADMIN, UserRole.TEACHER]);
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error || "Unauthorized" };
    }

    // Initialize alumni service
    const alumniService = new AlumniService();

    // Calculate statistics
    const statistics = await alumniService.calculateStatistics();

    return {
      success: true,
      data: statistics,
    };
  } catch (error) {
    console.error("Error fetching alumni statistics:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch alumni statistics",
    };
  }
}

/**
 * Generate alumni report
 * 
 * Requirements: 10.5, 10.6
 * 
 * @param input - Report filters and format
 * @returns Report data formatted for export
 */
export async function generateAlumniReport(
  input: GenerateAlumniReportInput
) {
  try {
    // Authentication and authorization check
    const authCheck = await checkAuth([UserRole.ADMIN]);
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error || "Unauthorized" };
    }

    // Validate input
    const validation = generateAlumniReportSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      };
    }

    const { graduationYearFrom, graduationYearTo, finalClass, format } = validation.data;

    // Initialize alumni service
    const alumniService = new AlumniService();

    // Generate report data
    const reportData = await alumniService.generateReportData({
      graduationYearFrom,
      graduationYearTo,
      finalClass,
    });

    // Log audit event for alumni report generation
    await logAudit({
      userId: authCheck.userId!,
      action: AuditAction.EXPORT,
      resource: "ALUMNI",
      changes: {
        operation: "REPORT_GENERATION",
        format,
        filters: { graduationYearFrom, graduationYearTo, finalClass },
        recordCount: reportData.length,
      },
    });

    // Build filter description for subtitle
    const filterParts: string[] = [];
    if (graduationYearFrom && graduationYearTo) {
      filterParts.push(`Graduation Years: ${graduationYearFrom}-${graduationYearTo}`);
    } else if (graduationYearFrom) {
      filterParts.push(`Graduation Year From: ${graduationYearFrom}`);
    } else if (graduationYearTo) {
      filterParts.push(`Graduation Year To: ${graduationYearTo}`);
    }
    if (finalClass) {
      filterParts.push(`Class: ${finalClass}`);
    }

    const subtitle = filterParts.length > 0
      ? `${filterParts.join(" | ")} | Generated on ${new Date().toLocaleString()}`
      : `Generated on ${new Date().toLocaleString()}`;

    // Return report data formatted for export
    return {
      success: true,
      data: {
        exportData: reportData,
        format,
        filename: `alumni-report-${new Date().toISOString().split("T")[0]}`,
        title: "Alumni Report",
        subtitle,
        generatedAt: new Date().toISOString(),
        recordCount: reportData.length,
      },
    };
  } catch (error) {
    console.error("Error generating alumni report:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate alumni report",
    };
  }
}

/**
 * Export alumni directory to PDF or Excel
 * 
 * Requirements: 10.5, 10.6
 * 
 * @param filters - Search filters
 * @param format - Export format (pdf or excel)
 * @returns Export data for client-side generation
 */
export async function exportAlumniDirectory(
  filters: AlumniSearchInput,
  format: "pdf" | "excel" = "excel"
) {
  try {
    // Authentication and authorization check
    const authCheck = await checkAuth([UserRole.ADMIN, UserRole.TEACHER]);
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error || "Unauthorized" };
    }

    // Validate input
    const validation = alumniSearchSchema.safeParse({
      ...filters,
      page: 1,
      pageSize: 10000, // Large page size for export
    });
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      };
    }

    const {
      searchTerm,
      graduationYearFrom,
      graduationYearTo,
      finalClass,
      currentCity,
      currentOccupation,
      collegeName,
      sortBy,
      sortOrder,
    } = validation.data;

    // Initialize alumni service
    const alumniService = new AlumniService();

    // Build search query
    const where = alumniService.buildSearchQuery({
      searchTerm,
      graduationYearFrom,
      graduationYearTo,
      finalClass,
      currentCity,
      currentOccupation,
      collegeName,
    });

    // Build order by clause
    let orderBy: any = {};
    if (sortBy === "name") {
      orderBy = {
        student: {
          user: {
            firstName: sortOrder,
          },
        },
      };
    } else if (sortBy === "graduationDate") {
      orderBy = { graduationDate: sortOrder };
    } else if (sortBy === "updatedAt") {
      orderBy = { updatedAt: sortOrder };
    }

    // Fetch all alumni (no pagination for export)
    const alumni = await db.alumni.findMany({
      where,
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
      orderBy,
    });

    // Format data for export
    const exportData = alumni.map((alumnus) => ({
      "Admission ID": alumnus.student.admissionId,
      "Name": `${alumnus.student.user.firstName} ${alumnus.student.user.lastName}`,
      "Graduation Date": alumnus.graduationDate.toLocaleDateString(),
      "Final Class": alumnus.finalClass,
      "Final Section": alumnus.finalSection,
      "Final Academic Year": alumnus.finalAcademicYear,
      "Current Occupation": alumnus.currentOccupation || "N/A",
      "Current Employer": alumnus.currentEmployer || "N/A",
      "Current Job Title": alumnus.currentJobTitle || "N/A",
      "Current City": alumnus.currentCity || "N/A",
      "Current State": alumnus.currentState || "N/A",
      "Current Country": alumnus.currentCountry || "N/A",
      "Current Email": alumnus.currentEmail || alumnus.student.user.email || "N/A",
      "Current Phone": alumnus.currentPhone || alumnus.student.user.phone || "N/A",
      "Higher Education": alumnus.higherEducation || "N/A",
      "College Name": alumnus.collegeName || "N/A",
      "College Location": alumnus.collegeLocation || "N/A",
      "College Graduation Year": alumnus.graduationYearCollege || "N/A",
      "LinkedIn Profile": alumnus.linkedInProfile || "N/A",
      "Allow Communication": alumnus.allowCommunication ? "Yes" : "No",
      "Last Updated": alumnus.updatedAt.toLocaleDateString(),
    }));

    // Log audit event for export
    await logAudit({
      userId: authCheck.userId!,
      action: AuditAction.EXPORT,
      resource: "ALUMNI",
      changes: {
        operation: "EXPORT_ALUMNI_DIRECTORY",
        format,
        filters: {
          searchTerm,
          graduationYearFrom,
          graduationYearTo,
          finalClass,
          currentCity,
          currentOccupation,
          collegeName,
        },
        recordCount: exportData.length,
      },
    });

    // Build filter description for subtitle
    const filterParts: string[] = [];
    if (searchTerm) {
      filterParts.push(`Search: "${searchTerm}"`);
    }
    if (graduationYearFrom && graduationYearTo) {
      filterParts.push(`Years: ${graduationYearFrom}-${graduationYearTo}`);
    } else if (graduationYearFrom) {
      filterParts.push(`From: ${graduationYearFrom}`);
    } else if (graduationYearTo) {
      filterParts.push(`To: ${graduationYearTo}`);
    }
    if (finalClass) {
      filterParts.push(`Class: ${finalClass}`);
    }
    if (currentCity) {
      filterParts.push(`City: ${currentCity}`);
    }
    if (currentOccupation) {
      filterParts.push(`Occupation: ${currentOccupation}`);
    }
    if (collegeName) {
      filterParts.push(`College: ${collegeName}`);
    }

    const subtitle = filterParts.length > 0
      ? `${filterParts.join(" | ")} | Generated on ${new Date().toLocaleString()}`
      : `Generated on ${new Date().toLocaleString()}`;

    return {
      success: true,
      data: {
        exportData,
        format,
        filename: `alumni-directory-${new Date().toISOString().split("T")[0]}`,
        title: "Alumni Directory",
        subtitle,
      },
    };
  } catch (error) {
    console.error("Error exporting alumni directory:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export alumni directory",
    };
  }
}

// ============================================================================
// Server Actions - Communication
// ============================================================================

/**
 * Send message to alumni group
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 * 
 * @param input - Message details and recipients
 * @returns Communication result
 */
export async function sendAlumniMessage(
  input: SendAlumniMessageInput
): Promise<AlumniCommunicationResult> {
  try {
    // Authentication and authorization check
    const authCheck = await checkAuth([UserRole.ADMIN]);
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error || "Unauthorized" };
    }

    // Validate input
    const validation = sendAlumniMessageSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      };
    }

    const { alumniIds, subject, message, channels } = validation.data;

    // Fetch alumni with communication preferences
    const alumni = await db.alumni.findMany({
      where: {
        id: { in: alumniIds },
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    if (alumni.length === 0) {
      return {
        success: false,
        error: "No alumni found with the provided IDs",
      };
    }

    // Filter alumni who allow communication
    const eligibleAlumni = alumni.filter((alumnus) => alumnus.allowCommunication);

    if (eligibleAlumni.length === 0) {
      return {
        success: false,
        error: "None of the selected alumni have opted in for communications",
      };
    }

    // Import communication service
    const { sendBulkNotification } = await import("@/lib/services/communication-service");
    const { CommunicationChannel, NotificationType } = await import("@/lib/types/communication");

    // Map channels to communication service format
    const channelMap: Record<string, any> = {
      email: CommunicationChannel.EMAIL,
      sms: CommunicationChannel.SMS,
      whatsapp: CommunicationChannel.WHATSAPP,
    };

    const results: Array<{
      alumniId: string;
      alumniName: string;
      success: boolean;
      error?: string;
    }> = [];

    let successCount = 0;
    let failureCount = 0;

    // Send messages via each channel
    for (const channel of channels) {
      const commChannel = channelMap[channel];
      if (!commChannel) continue;

      // Get user IDs for bulk notification
      const userIds = eligibleAlumni.map((alumnus) => alumnus.student.user.id);

      try {
        const bulkResult = await sendBulkNotification({
          recipients: userIds,
          type: NotificationType.GENERAL,
          title: subject,
          message,
          channel: commChannel,
        });

        // Process results
        for (let i = 0; i < eligibleAlumni.length; i++) {
          const alumnus = eligibleAlumni[i];
          const userId = alumnus.student.user.id;
          const result = bulkResult.results.find((r) => r.userId === userId);

          const existingResult = results.find((r) => r.alumniId === alumnus.id);
          if (existingResult) {
            // Update existing result
            if (result?.success) {
              existingResult.success = true;
              existingResult.error = undefined;
            }
          } else {
            // Add new result
            results.push({
              alumniId: alumnus.id,
              alumniName: `${alumnus.student.user.firstName} ${alumnus.student.user.lastName}`,
              success: result?.success || false,
              error: result?.error,
            });
          }
        }
      } catch (error) {
        console.error(`Error sending via ${channel}:`, error);
        // Continue with other channels
      }
    }

    // Count successes and failures
    successCount = results.filter((r) => r.success).length;
    failureCount = results.filter((r) => !r.success).length;

    // Log audit event for alumni communication
    await logAudit({
      userId: authCheck.userId!,
      action: AuditAction.CREATE,
      resource: "ALUMNI_COMMUNICATION",
      changes: {
        operation: "BULK_COMMUNICATION",
        subject,
        totalRecipients: alumniIds.length,
        eligibleRecipients: eligibleAlumni.length,
        successCount,
        failureCount,
        channels,
      },
    });

    return {
      success: successCount > 0,
      data: {
        totalRecipients: alumniIds.length,
        successCount,
        failureCount,
        results,
      },
    };
  } catch (error) {
    console.error("Error sending alumni message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send alumni message",
    };
  }
}

/**
 * Get alumni for communication (with filters)
 * 
 * Requirements: 7.2, 7.5
 * 
 * @param input - Communication filters
 * @returns List of alumni eligible for communication
 */
export async function getAlumniForCommunication(
  input: GetAlumniForCommunicationInput
) {
  try {
    // Authentication and authorization check
    const authCheck = await checkAuth([UserRole.ADMIN]);
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error || "Unauthorized" };
    }

    // Validate input
    const validation = getAlumniForCommunicationSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      };
    }

    const {
      graduationYearFrom,
      graduationYearTo,
      finalClass,
      currentCity,
      allowCommunicationOnly,
    } = validation.data;

    // Initialize alumni service
    const alumniService = new AlumniService();

    // Build search query
    const where = alumniService.buildSearchQuery({
      graduationYearFrom,
      graduationYearTo,
      finalClass,
      currentCity,
    });

    // Add communication preference filter
    if (allowCommunicationOnly) {
      where.allowCommunication = true;
    }

    // Fetch alumni
    const alumni = await db.alumni.findMany({
      where,
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

    // Format alumni data
    const formattedAlumni = alumni.map((alumnus) => ({
      id: alumnus.id,
      studentName: `${alumnus.student.user.firstName} ${alumnus.student.user.lastName}`,
      admissionId: alumnus.student.admissionId,
      graduationDate: alumnus.graduationDate,
      finalClass: alumnus.finalClass,
      currentEmail: alumnus.currentEmail || alumnus.student.user.email || undefined,
      currentPhone: alumnus.currentPhone || alumnus.student.user.phone,
      allowCommunication: alumnus.allowCommunication,
      communicationEmail: alumnus.communicationEmail || alumnus.student.user.email,
    }));

    return {
      success: true,
      data: {
        alumni: formattedAlumni,
        total: formattedAlumni.length,
      },
    };
  } catch (error) {
    console.error("Error fetching alumni for communication:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch alumni for communication",
    };
  }
}
