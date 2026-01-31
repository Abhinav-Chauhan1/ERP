"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import { requireSchoolAccess } from "@/lib/auth/tenant";
import {
  meritListConfigSchema,
  MeritListConfigFormValues,
  generateMeritListSchema,
  GenerateMeritListFormValues,
} from "../schemaValidation/meritListSchemaValidation";

// Create merit list configuration
export async function createMeritListConfig(data: MeritListConfigFormValues) {
  try {
    // Get schoolId from current user context
    const { schoolId } = await requireSchoolAccess();
    
    // Validate the input data
    const validatedData = meritListConfigSchema.parse(data);

    // Validate that total weight equals 100
    const totalWeight = validatedData.criteria.reduce((sum, c) => sum + c.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      return {
        success: false,
        error: `Total weight must equal 100%. Current total: ${totalWeight}%`,
      };
    }

    // Create the configuration
    const config = await db.meritListConfig.create({
      data: {
        name: validatedData.name,
        appliedClassId: validatedData.appliedClassId,
        criteria: validatedData.criteria,
        isActive: true,
        schoolId: schoolId || "",
      },
      include: {
        appliedClass: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      data: config,
      message: "Merit list configuration created successfully",
    };
  } catch (error) {
    console.error("Error creating merit list config:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        details: error.errors,
      };
    }

    return {
      success: false,
      error: "Failed to create merit list configuration. Please try again.",
    };
  }
}

// Get all merit list configurations
export async function getMeritListConfigs(classId?: string) {
  try {
    const where: any = {};

    if (classId) {
      where.appliedClassId = classId;
    }

    const configs = await db.meritListConfig.findMany({
      where,
      include: {
        appliedClass: {
          select: {
            name: true,
          },
        },
        meritLists: {
          select: {
            id: true,
            generatedAt: true,
            totalApplications: true,
          },
          orderBy: {
            generatedAt: "desc",
          },
          take: 1, // Get only the latest merit list
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return configs;
  } catch (error) {
    console.error("Error fetching merit list configs:", error);
    throw new Error("Failed to fetch merit list configurations");
  }
}

// Get single merit list configuration
export async function getMeritListConfigById(id: string) {
  try {
    const config = await db.meritListConfig.findUnique({
      where: { id },
      include: {
        appliedClass: {
          select: {
            name: true,
          },
        },
        meritLists: {
          include: {
            entries: {
              include: {
                application: {
                  select: {
                    applicationNumber: true,
                    studentName: true,
                    parentName: true,
                    submittedAt: true,
                  },
                },
              },
              orderBy: {
                rank: "asc",
              },
            },
          },
          orderBy: {
            generatedAt: "desc",
          },
        },
      },
    });

    return config;
  } catch (error) {
    console.error("Error fetching merit list config:", error);
    throw new Error("Failed to fetch merit list configuration");
  }
}

// Update merit list configuration
export async function updateMeritListConfig(
  id: string,
  data: MeritListConfigFormValues
) {
  try {
    // Get schoolId from current user context
    const { schoolId } = await requireSchoolAccess();
    
    // Validate the input data
    const validatedData = meritListConfigSchema.parse(data);

    // Validate that total weight equals 100
    const totalWeight = validatedData.criteria.reduce((sum, c) => sum + c.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      return {
        success: false,
        error: `Total weight must equal 100%. Current total: ${totalWeight}%`,
      };
    }

    // Update the configuration
    const config = await db.meritListConfig.update({
      where: { id },
      data: {
        name: validatedData.name,
        appliedClassId: validatedData.appliedClassId,
        criteria: validatedData.criteria,
        schoolId: schoolId || "",
      },
      include: {
        appliedClass: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      data: config,
      message: "Merit list configuration updated successfully",
    };
  } catch (error) {
    console.error("Error updating merit list config:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        details: error.errors,
      };
    }

    return {
      success: false,
      error: "Failed to update merit list configuration. Please try again.",
    };
  }
}

// Delete merit list configuration
export async function deleteMeritListConfig(id: string) {
  try {
    await db.meritListConfig.delete({
      where: { id },
    });

    return {
      success: true,
      message: "Merit list configuration deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting merit list config:", error);
    return {
      success: false,
      error: "Failed to delete merit list configuration. Please try again.",
    };
  }
}

// Calculate score for an application based on criteria
function calculateApplicationScore(
  application: any,
  criteria: Array<{ field: string; weight: number; order: "asc" | "desc" }>
): number {
  let totalScore = 0;

  for (const criterion of criteria) {
    let value = 0;

    switch (criterion.field) {
      case "submittedAt":
        // Earlier submission gets higher score (normalize to 0-1 range)
        // This will be calculated relative to all applications
        value = new Date(application.submittedAt).getTime();
        break;
      case "dateOfBirth":
        // Age-based scoring
        value = new Date(application.dateOfBirth).getTime();
        break;
      default:
        value = 0;
    }

    // Apply weight
    totalScore += value * (criterion.weight / 100);
  }

  return totalScore;
}

// Normalize scores to 0-100 range
function normalizeScores(
  applications: Array<any>,
  criteria: Array<{ field: string; weight: number; order: "asc" | "desc" }>
): Array<{ id: string; score: number }> {
  // For each criterion, normalize the values
  const normalizedScores = applications.map((app) => ({
    id: app.id,
    score: 0,
  }));

  // Get min and max for each criterion
  for (const criterion of criteria) {
    const values = applications.map((app) => {
      switch (criterion.field) {
        case "submittedAt":
          return new Date(app.submittedAt).getTime();
        case "dateOfBirth":
          return new Date(app.dateOfBirth).getTime();
        default:
          return 0;
      }
    });

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1; // Avoid division by zero

    applications.forEach((app, index) => {
      const value = values[index];
      let normalizedValue = (value - min) / range; // 0-1 range

      // If order is 'asc', lower values should get higher scores
      if (criterion.order === "asc") {
        normalizedValue = 1 - normalizedValue;
      }

      // Apply weight and add to total score
      normalizedScores[index].score += normalizedValue * criterion.weight;
    });
  }

  return normalizedScores;
}

// Generate merit list based on configuration
export async function generateMeritList(
  data: GenerateMeritListFormValues,
  generatedBy?: string
) {
  try {
    // Get schoolId from current user context
    const { schoolId } = await requireSchoolAccess();
    
    // Validate the input data
    const validatedData = generateMeritListSchema.parse(data);

    // Get the configuration
    const config = await db.meritListConfig.findUnique({
      where: { id: validatedData.configId },
    });

    if (!config) {
      return {
        success: false,
        error: "Merit list configuration not found",
      };
    }

    // Get all SUBMITTED or UNDER_REVIEW applications for the class
    const applications = await db.admissionApplication.findMany({
      where: {
        appliedClassId: validatedData.appliedClassId,
        status: {
          in: ["SUBMITTED", "UNDER_REVIEW"],
        },
      },
      orderBy: {
        submittedAt: "asc",
      },
    });

    if (applications.length === 0) {
      return {
        success: false,
        error: "No applications found for this class",
      };
    }

    // Calculate scores for each application
    const criteria = config.criteria as Array<{
      field: string;
      weight: number;
      order: "asc" | "desc";
    }>;

    const scoredApplications = normalizeScores(applications, criteria);

    // Sort by score (descending - higher score = better rank)
    scoredApplications.sort((a, b) => b.score - a.score);

    // Create merit list
    const meritList = await db.meritList.create({
      data: {
        configId: validatedData.configId,
        appliedClassId: validatedData.appliedClassId,
        generatedBy,
        totalApplications: applications.length,
        schoolId: schoolId || "",
        entries: {
          create: scoredApplications.map((app, index) => ({
            applicationId: app.id,
            rank: index + 1,
            score: app.score,
            schoolId: schoolId || "",
          })),
        },
      },
      include: {
        config: {
          select: {
            name: true,
          },
        },
        appliedClass: {
          select: {
            name: true,
          },
        },
        entries: {
          include: {
            application: {
              select: {
                applicationNumber: true,
                studentName: true,
                parentName: true,
                parentEmail: true,
                submittedAt: true,
                status: true,
              },
            },
          },
          orderBy: {
            rank: "asc",
          },
        },
      },
    });

    return {
      success: true,
      data: meritList,
      message: `Merit list generated successfully with ${applications.length} applications`,
    };
  } catch (error) {
    console.error("Error generating merit list:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        details: error.errors,
      };
    }

    return {
      success: false,
      error: "Failed to generate merit list. Please try again.",
    };
  }
}

// Get merit list by ID
export async function getMeritListById(id: string) {
  try {
    const meritList = await db.meritList.findUnique({
      where: { id },
      include: {
        config: {
          select: {
            name: true,
            criteria: true,
          },
        },
        appliedClass: {
          select: {
            name: true,
          },
        },
        entries: {
          include: {
            application: {
              select: {
                applicationNumber: true,
                studentName: true,
                dateOfBirth: true,
                gender: true,
                parentName: true,
                parentEmail: true,
                parentPhone: true,
                previousSchool: true,
                submittedAt: true,
                status: true,
              },
            },
          },
          orderBy: {
            rank: "asc",
          },
        },
      },
    });

    return meritList;
  } catch (error) {
    console.error("Error fetching merit list:", error);
    throw new Error("Failed to fetch merit list");
  }
}

// Get all merit lists
export async function getMeritLists(classId?: string) {
  try {
    const where: any = {};

    if (classId) {
      where.appliedClassId = classId;
    }

    const meritLists = await db.meritList.findMany({
      where,
      include: {
        config: {
          select: {
            name: true,
          },
        },
        appliedClass: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            entries: true,
          },
        },
      },
      orderBy: {
        generatedAt: "desc",
      },
    });

    return meritLists;
  } catch (error) {
    console.error("Error fetching merit lists:", error);
    throw new Error("Failed to fetch merit lists");
  }
}

// Delete merit list
export async function deleteMeritList(id: string) {
  try {
    await db.meritList.delete({
      where: { id },
    });

    return {
      success: true,
      message: "Merit list deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting merit list:", error);
    return {
      success: false,
      error: "Failed to delete merit list. Please try again.",
    };
  }
}
