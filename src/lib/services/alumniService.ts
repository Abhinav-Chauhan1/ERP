/**
 * Alumni Service
 * 
 * This service handles the business logic for alumni management operations.
 * It provides search query building, statistics calculation, report generation,
 * and profile validation functionality.
 * 
 * Requirements: 6.2, 6.3, 10.1, 10.2, 10.3, 10.4
 */

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { memoryCache, CACHE_DURATION, CACHE_TAGS } from "@/lib/utils/cache";

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface AlumniSearchFilters {
  searchTerm?: string;
  graduationYearFrom?: number;
  graduationYearTo?: number;
  finalClass?: string;
  currentCity?: string;
  currentOccupation?: string;
  collegeName?: string;
}

export interface AlumniStatistics {
  totalAlumni: number;
  byGraduationYear: Record<number, number>;
  byOccupation: Record<string, number>;
  byCollege: Record<string, number>;
  byCity: Record<string, number>;
}

export interface AlumniReportFilters {
  graduationYearFrom?: number;
  graduationYearTo?: number;
  finalClass?: string;
}

export interface AlumniProfileUpdateData {
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
  allowCommunication?: boolean;
  communicationEmail?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================================================
// Alumni Service Class
// ============================================================================

export class AlumniService {
  /**
   * Build search query with filters
   * 
   * Constructs a Prisma where clause based on provided search filters.
   * Supports:
   * - Full-text search on student name and admission ID
   * - Graduation year range filtering
   * - Class, city, occupation, and college filtering
   * 
   * Requirements: 6.2, 6.3
   * 
   * @param filters - Search filters
   * @returns Prisma where input for Alumni queries
   */
  buildSearchQuery(filters: AlumniSearchFilters): Prisma.AlumniWhereInput {
    const where: Prisma.AlumniWhereInput = {};

    // Search term - search in student name and admission ID
    if (filters.searchTerm && filters.searchTerm.trim()) {
      const searchTerm = filters.searchTerm.trim();
      where.OR = [
        {
          student: {
            user: {
              OR: [
                { firstName: { contains: searchTerm, mode: "insensitive" } },
                { lastName: { contains: searchTerm, mode: "insensitive" } },
              ],
            },
          },
        },
        {
          student: {
            admissionId: { contains: searchTerm, mode: "insensitive" },
          },
        },
      ];
    }

    // Graduation year range
    if (filters.graduationYearFrom || filters.graduationYearTo) {
      where.graduationDate = {};
      
      if (filters.graduationYearFrom) {
        // Start of the year
        where.graduationDate.gte = new Date(`${filters.graduationYearFrom}-01-01`);
      }
      
      if (filters.graduationYearTo) {
        // End of the year
        where.graduationDate.lte = new Date(`${filters.graduationYearTo}-12-31`);
      }
    }

    // Final class filter
    if (filters.finalClass) {
      where.finalClass = filters.finalClass;
    }

    // Current city filter
    if (filters.currentCity) {
      where.currentCity = {
        contains: filters.currentCity,
        mode: "insensitive",
      };
    }

    // Current occupation filter
    if (filters.currentOccupation) {
      where.currentOccupation = {
        contains: filters.currentOccupation,
        mode: "insensitive",
      };
    }

    // College name filter
    if (filters.collegeName) {
      where.collegeName = {
        contains: filters.collegeName,
        mode: "insensitive",
      };
    }

    return where;
  }

  /**
   * Calculate alumni statistics
   * 
   * Aggregates alumni data to provide statistics for:
   * - Total alumni count
   * - Distribution by graduation year
   * - Distribution by occupation
   * - Distribution by college
   * - Distribution by city
   * 
   * Uses caching to improve performance for frequently accessed statistics.
   * 
   * Requirements: 10.1, 10.2, 10.3, 10.4
   * 
   * @returns Alumni statistics object
   */
  async calculateStatistics(): Promise<AlumniStatistics> {
    // Check cache first
    const cacheKey = "alumni:statistics:all";
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Get total alumni count
    const totalAlumni = await db.alumni.count();

    // Get all alumni with relevant fields for aggregation
    const alumni = await db.alumni.findMany({
      select: {
        graduationDate: true,
        currentOccupation: true,
        collegeName: true,
        currentCity: true,
      },
    });

    // Initialize statistics objects
    const byGraduationYear: Record<number, number> = {};
    const byOccupation: Record<string, number> = {};
    const byCollege: Record<string, number> = {};
    const byCity: Record<string, number> = {};

    // Aggregate data
    for (const alumnus of alumni) {
      // By graduation year
      const year = alumnus.graduationDate.getFullYear();
      byGraduationYear[year] = (byGraduationYear[year] || 0) + 1;

      // By occupation
      if (alumnus.currentOccupation) {
        const occupation = alumnus.currentOccupation;
        byOccupation[occupation] = (byOccupation[occupation] || 0) + 1;
      }

      // By college
      if (alumnus.collegeName) {
        const college = alumnus.collegeName;
        byCollege[college] = (byCollege[college] || 0) + 1;
      }

      // By city
      if (alumnus.currentCity) {
        const city = alumnus.currentCity;
        byCity[city] = (byCity[city] || 0) + 1;
      }
    }

    const statistics = {
      totalAlumni,
      byGraduationYear,
      byOccupation,
      byCollege,
      byCity,
    };

    // Cache for 30 minutes
    memoryCache.set(cacheKey, statistics, CACHE_DURATION.ALUMNI_STATISTICS * 1000);

    return statistics;
  }

  /**
   * Generate alumni report data
   * 
   * Fetches alumni data based on filters for report generation.
   * Returns comprehensive alumni information suitable for PDF or Excel export.
   * 
   * Requirements: 10.5, 10.6
   * 
   * @param filters - Report filters
   * @returns Array of alumni data for report
   */
  async generateReportData(filters: AlumniReportFilters): Promise<any[]> {
    // Build where clause from filters
    const where: Prisma.AlumniWhereInput = {};

    // Graduation year range
    if (filters.graduationYearFrom || filters.graduationYearTo) {
      where.graduationDate = {};
      
      if (filters.graduationYearFrom) {
        where.graduationDate.gte = new Date(`${filters.graduationYearFrom}-01-01`);
      }
      
      if (filters.graduationYearTo) {
        where.graduationDate.lte = new Date(`${filters.graduationYearTo}-12-31`);
      }
    }

    // Final class filter
    if (filters.finalClass) {
      where.finalClass = filters.finalClass;
    }

    // Fetch alumni data with student information
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

    // Transform data for report
    return alumni.map((alumnus) => ({
      // Student information
      admissionId: alumnus.student.admissionId,
      firstName: alumnus.student.user.firstName,
      lastName: alumnus.student.user.lastName,
      fullName: `${alumnus.student.user.firstName} ${alumnus.student.user.lastName}`,
      email: alumnus.student.user.email,
      phone: alumnus.student.user.phone || alumnus.student.phone,
      
      // Graduation details
      graduationDate: alumnus.graduationDate,
      graduationYear: alumnus.graduationDate.getFullYear(),
      finalClass: alumnus.finalClass,
      finalSection: alumnus.finalSection,
      finalAcademicYear: alumnus.finalAcademicYear,
      
      // Current information
      currentOccupation: alumnus.currentOccupation || "N/A",
      currentEmployer: alumnus.currentEmployer || "N/A",
      currentJobTitle: alumnus.currentJobTitle || "N/A",
      currentAddress: alumnus.currentAddress || "N/A",
      currentCity: alumnus.currentCity || "N/A",
      currentState: alumnus.currentState || "N/A",
      currentCountry: alumnus.currentCountry || "India",
      currentPhone: alumnus.currentPhone || "N/A",
      currentEmail: alumnus.currentEmail || alumnus.student.user.email,
      
      // Higher education
      higherEducation: alumnus.higherEducation || "N/A",
      collegeName: alumnus.collegeName || "N/A",
      collegeLocation: alumnus.collegeLocation || "N/A",
      graduationYearCollege: alumnus.graduationYearCollege || "N/A",
      
      // Additional information
      achievements: alumnus.achievements 
        ? JSON.parse(alumnus.achievements) 
        : [],
      linkedInProfile: alumnus.linkedInProfile || "N/A",
      
      // Communication preferences
      allowCommunication: alumnus.allowCommunication ? "Yes" : "No",
      communicationEmail: alumnus.communicationEmail || alumnus.student.user.email,
      
      // Metadata
      createdAt: alumnus.createdAt,
      updatedAt: alumnus.updatedAt,
    }));
  }

  /**
   * Validate alumni profile update
   * 
   * Validates alumni profile update data before saving.
   * Checks for:
   * - Valid email format
   * - Valid phone number format
   * - Valid graduation year (if provided)
   * - Valid LinkedIn URL format (if provided)
   * - Required field presence
   * 
   * Requirements: 5.2, 5.3, 5.4, 5.5
   * 
   * @param data - Alumni profile update data
   * @returns Validation result with errors if any
   */
  validateProfileUpdate(data: AlumniProfileUpdateData): ValidationResult {
    const errors: string[] = [];

    // Validate email format if provided
    if (data.currentEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.currentEmail)) {
        errors.push("Invalid email format for current email");
      }
    }

    // Validate communication email format if provided
    if (data.communicationEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.communicationEmail)) {
        errors.push("Invalid email format for communication email");
      }
    }

    // Validate phone number format if provided (Indian format)
    if (data.currentPhone) {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(data.currentPhone.replace(/[\s\-\(\)]/g, ""))) {
        errors.push("Invalid phone number format (should be 10 digits starting with 6-9)");
      }
    }

    // Validate graduation year if provided
    if (data.graduationYearCollege !== undefined) {
      const currentYear = new Date().getFullYear();
      if (
        data.graduationYearCollege < 1900 ||
        data.graduationYearCollege > currentYear + 10
      ) {
        errors.push(
          `Invalid graduation year (should be between 1900 and ${currentYear + 10})`
        );
      }
    }

    // Validate LinkedIn URL format if provided
    if (data.linkedInProfile) {
      const linkedInRegex = /^(https?:\/\/)?(www\.)?linkedin\.com\/.+$/i;
      if (!linkedInRegex.test(data.linkedInProfile)) {
        errors.push("Invalid LinkedIn profile URL format");
      }
    }

    // Validate achievements array if provided
    if (data.achievements) {
      if (!Array.isArray(data.achievements)) {
        errors.push("Achievements must be an array");
      } else {
        // Check if all achievements are strings
        const invalidAchievements = data.achievements.filter(
          (achievement) => typeof achievement !== "string"
        );
        if (invalidAchievements.length > 0) {
          errors.push("All achievements must be strings");
        }
      }
    }

    // Validate string length constraints
    if (data.currentOccupation && data.currentOccupation.length > 200) {
      errors.push("Current occupation must be less than 200 characters");
    }

    if (data.currentEmployer && data.currentEmployer.length > 200) {
      errors.push("Current employer must be less than 200 characters");
    }

    if (data.currentJobTitle && data.currentJobTitle.length > 200) {
      errors.push("Current job title must be less than 200 characters");
    }

    if (data.currentAddress && data.currentAddress.length > 500) {
      errors.push("Current address must be less than 500 characters");
    }

    if (data.higherEducation && data.higherEducation.length > 200) {
      errors.push("Higher education must be less than 200 characters");
    }

    if (data.collegeName && data.collegeName.length > 200) {
      errors.push("College name must be less than 200 characters");
    }

    if (data.collegeLocation && data.collegeLocation.length > 200) {
      errors.push("College location must be less than 200 characters");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Invalidate alumni cache
   * 
   * Call this method when alumni data is updated to clear cached results.
   * This ensures users see fresh data after updates.
   * 
   * @param alumniId - Optional specific alumni ID to invalidate
   */
  invalidateCache(alumniId?: string): void {
    // Clear statistics cache
    memoryCache.delete("alumni:statistics:all");

    // Clear specific alumni cache if ID provided
    if (alumniId) {
      memoryCache.delete(`alumni:profile:${alumniId}`);
    }

    // Note: Search result caches will expire naturally based on TTL
    // For immediate invalidation, we could implement pattern-based deletion
    // but that would require a more sophisticated cache implementation
  }

  /**
   * Generate cache key for search queries
   * 
   * Creates a consistent cache key based on search filters.
   * 
   * @param filters - Search filters
   * @returns Cache key string
   */
  generateSearchCacheKey(filters: AlumniSearchFilters): string {
    const parts = [
      "alumni:search",
      filters.searchTerm || "",
      filters.graduationYearFrom || "",
      filters.graduationYearTo || "",
      filters.finalClass || "",
      filters.currentCity || "",
      filters.currentOccupation || "",
      filters.collegeName || "",
    ];
    return parts.join(":");
  }
}
