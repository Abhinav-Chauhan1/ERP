/**
 * Fee Structure Analytics Service
 * 
 * Provides analytics and reporting functionality for fee structures.
 * Calculates student impact, revenue projections, and usage statistics.
 * 
 * @module fee-structure-analytics-service
 */

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface FeeStructureAnalytics {
  totalStructures: number;
  activeStructures: number;
  templateStructures: number;
  structuresByAcademicYear: AcademicYearStats[];
  structureDetails: FeeStructureDetail[];
}

export interface AcademicYearStats {
  academicYearId: string;
  academicYearName: string;
  totalStructures: number;
  activeStructures: number;
  totalStudentsAffected: number;
  totalRevenueProjection: number;
}

export interface FeeStructureDetail {
  id: string;
  name: string;
  academicYearId: string;
  academicYearName: string;
  isActive: boolean;
  isTemplate: boolean;
  classCount: number;
  classNames: string[];
  studentsAffected: number;
  totalAmount: number;
  revenueProjection: number;
  createdAt: Date;
}

export interface AnalyticsFilters {
  academicYearId?: string;
  classId?: string;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
}

// ============================================================================
// Fee Structure Analytics Service
// ============================================================================

export class FeeStructureAnalyticsService {
  /**
   * Get comprehensive analytics for fee structures
   * 
   * @param filters - Optional filters for analytics
   * @returns Analytics data including totals, breakdowns, and projections
   */
  async getFeeStructureAnalytics(filters: AnalyticsFilters = {}): Promise<FeeStructureAnalytics> {
    // Build where clause for filters
    const where: Prisma.FeeStructureWhereInput = {};

    if (filters.academicYearId) {
      where.academicYearId = filters.academicYearId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.classId) {
      where.classes = {
        some: {
          classId: filters.classId,
        },
      };
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    // Get all fee structures with related data
    const feeStructures = await db.feeStructure.findMany({
      where,
      include: {
        academicYear: true,
        classes: {
          include: {
            class: {
              include: {
                enrollments: {
                  select: {
                    studentId: true,
                  },
                },
              },
            },
          },
        },
        items: {
          include: {
            feeType: true,
          },
        },
      },
    });

    // Calculate totals
    const totalStructures = feeStructures.length;
    const activeStructures = feeStructures.filter((fs) => fs.isActive && !fs.isTemplate).length;
    const templateStructures = feeStructures.filter((fs) => fs.isTemplate).length;

    // Group by academic year
    const academicYearMap = new Map<string, AcademicYearStats>();

    // Calculate structure details
    const structureDetails: FeeStructureDetail[] = [];

    for (const structure of feeStructures) {
      // Calculate total amount for this structure
      const totalAmount = structure.items.reduce((sum, item) => sum + item.amount, 0);

      // Get unique students affected by this structure
      const studentIds = new Set<string>();
      structure.classes.forEach((fsc) => {
        fsc.class.enrollments.forEach((enrollment) => {
          studentIds.add(enrollment.studentId);
        });
      });
      const studentsAffected = studentIds.size;

      // Calculate revenue projection
      const revenueProjection = totalAmount * studentsAffected;

      // Add to structure details
      structureDetails.push({
        id: structure.id,
        name: structure.name,
        academicYearId: structure.academicYearId,
        academicYearName: structure.academicYear.name,
        isActive: structure.isActive,
        isTemplate: structure.isTemplate,
        classCount: structure.classes.length,
        classNames: structure.classes.map((fsc) => fsc.class.name),
        studentsAffected,
        totalAmount,
        revenueProjection,
        createdAt: structure.createdAt,
      });

      // Update academic year stats
      const yearId = structure.academicYearId;
      if (!academicYearMap.has(yearId)) {
        academicYearMap.set(yearId, {
          academicYearId: yearId,
          academicYearName: structure.academicYear.name,
          totalStructures: 0,
          activeStructures: 0,
          totalStudentsAffected: 0,
          totalRevenueProjection: 0,
        });
      }

      const yearStats = academicYearMap.get(yearId)!;
      yearStats.totalStructures++;
      if (structure.isActive && !structure.isTemplate) {
        yearStats.activeStructures++;
        yearStats.totalStudentsAffected += studentsAffected;
        yearStats.totalRevenueProjection += revenueProjection;
      }
    }

    // Convert map to array and sort by academic year name
    const structuresByAcademicYear = Array.from(academicYearMap.values()).sort((a, b) =>
      a.academicYearName.localeCompare(b.academicYearName)
    );

    return {
      totalStructures,
      activeStructures,
      templateStructures,
      structuresByAcademicYear,
      structureDetails: structureDetails.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    };
  }

  /**
   * Get students affected by a specific fee structure
   * 
   * @param feeStructureId - Fee structure ID
   * @returns Number of students affected and their details
   */
  async getStudentsAffectedByStructure(feeStructureId: string) {
    const structure = await db.feeStructure.findUnique({
      where: { id: feeStructureId },
      include: {
        classes: {
          include: {
            class: {
              include: {
                enrollments: {
                  include: {
                    student: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!structure) {
      throw new Error("Fee structure not found");
    }

    // Get unique students
    const studentMap = new Map();
    structure.classes.forEach((fsc: any) => {
      fsc.class.enrollments.forEach((enrollment: any) => {
        if (!studentMap.has(enrollment.studentId)) {
          studentMap.set(enrollment.studentId, {
            id: enrollment.student.id,
            firstName: enrollment.student.firstName,
            lastName: enrollment.student.lastName,
            email: enrollment.student.email || enrollment.student.userId,
            className: fsc.class.name,
          });
        }
      });
    });

    const students = Array.from(studentMap.values());

    return {
      count: students.length,
      students,
    };
  }

  /**
   * Calculate revenue projection for a fee structure
   * 
   * @param feeStructureId - Fee structure ID
   * @returns Revenue projection details
   */
  async calculateRevenueProjection(feeStructureId: string) {
    const structure = await db.feeStructure.findUnique({
      where: { id: feeStructureId },
      include: {
        classes: {
          include: {
            class: {
              include: {
                enrollments: true,
              },
            },
          },
        },
        items: {
          include: {
            feeType: true,
          },
        },
      },
    });

    if (!structure) {
      throw new Error("Fee structure not found");
    }

    // Calculate total amount
    const totalAmount = structure.items.reduce((sum, item) => sum + item.amount, 0);

    // Get unique students
    const studentIds = new Set<string>();
    structure.classes.forEach((fsc) => {
      fsc.class.enrollments.forEach((enrollment) => {
        studentIds.add(enrollment.studentId);
      });
    });

    const studentsAffected = studentIds.size;
    const revenueProjection = totalAmount * studentsAffected;

    // Break down by fee type
    const feeTypeBreakdown = structure.items.map((item) => ({
      feeTypeId: item.feeTypeId,
      feeTypeName: item.feeType.name,
      amount: item.amount,
      projection: item.amount * studentsAffected,
    }));

    return {
      feeStructureId: structure.id,
      feeStructureName: structure.name,
      totalAmount,
      studentsAffected,
      revenueProjection,
      feeTypeBreakdown,
    };
  }

  /**
   * Get usage trends over time
   * 
   * @param academicYearId - Optional academic year filter
   * @returns Trend data for fee structure usage
   */
  async getUsageTrends(academicYearId?: string) {
    const where: Prisma.FeeStructureWhereInput = {
      isTemplate: false,
    };

    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    // Get structures grouped by creation month
    const structures = await db.feeStructure.findMany({
      where,
      select: {
        id: true,
        name: true,
        createdAt: true,
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Group by month
    const monthlyData = new Map<string, { created: number; active: number }>();

    structures.forEach((structure) => {
      const monthKey = structure.createdAt.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { created: 0, active: 0 });
      }
      const data = monthlyData.get(monthKey)!;
      data.created++;
      if (structure.isActive) {
        data.active++;
      }
    });

    // Convert to array
    const trends = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        created: data.created,
        active: data.active,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return trends;
  }
}

// Export singleton instance
export const feeStructureAnalyticsService = new FeeStructureAnalyticsService();
