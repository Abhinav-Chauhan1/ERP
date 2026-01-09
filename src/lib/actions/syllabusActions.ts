"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  SyllabusFormValues,
  SyllabusUpdateFormValues,
  SyllabusScopeFilterValues,
  SyllabusUnitFormValues,
  SyllabusUnitUpdateFormValues,
  LessonFormValues,
  LessonUpdateFormValues
} from "../schemaValidation/syllabusSchemaValidations";
import { uploadToCloudinary, getResourceType } from "@/lib/cloudinary";
import { SyllabusStatus, CurriculumType, Prisma } from "@prisma/client";

// Get all subjects for dropdown
export async function getSubjectsForDropdown() {
  try {
    const subjects = await db.subject.findMany({
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        code: true,
      }
    });

    return { success: true, data: subjects };
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch subjects"
    };
  }
}

// Get all academic years for dropdown
export async function getAcademicYearsForDropdown() {
  try {
    const academicYears = await db.academicYear.findMany({
      orderBy: {
        startDate: 'desc',
      },
      select: {
        id: true,
        name: true,
      }
    });

    return { success: true, data: academicYears };
  } catch (error) {
    console.error("Error fetching academic years:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch academic years"
    };
  }
}

// Get classes for dropdown (optionally filtered by academic year)
export async function getClassesForDropdown(academicYearId?: string) {
  try {
    const where: Prisma.ClassWhereInput = {};

    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    const classes = await db.class.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
      }
    });

    return { success: true, data: classes };
  } catch (error) {
    console.error("Error fetching classes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch classes"
    };
  }
}

// Get sections for dropdown (filtered by class)
export async function getSectionsForDropdown(classId: string) {
  try {
    const sections = await db.classSection.findMany({
      where: {
        classId,
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
      }
    });

    return { success: true, data: sections };
  } catch (error) {
    console.error("Error fetching sections:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch sections"
    };
  }
}

// Validate syllabus scope configuration
export async function validateSyllabusScope(scope: {
  subjectId: string;
  academicYearId?: string;
  classId?: string;
  sectionId?: string;
  scopeType: 'SUBJECT_WIDE' | 'CLASS_WIDE' | 'SECTION_SPECIFIC';
}) {
  try {
    // Validate scope type requirements
    if (scope.scopeType === 'CLASS_WIDE' && !scope.classId) {
      return {
        isValid: false,
        error: "Class must be selected for class-wide syllabus",
        field: "classId"
      };
    }

    if (scope.scopeType === 'SECTION_SPECIFIC' && (!scope.classId || !scope.sectionId)) {
      return {
        isValid: false,
        error: "Both class and section must be selected for section-specific syllabus",
        field: !scope.classId ? "classId" : "sectionId"
      };
    }

    // Validate foreign key references exist

    // Validate subject exists
    const subject = await db.subject.findUnique({
      where: { id: scope.subjectId },
      select: { id: true }
    });

    if (!subject) {
      return {
        isValid: false,
        error: "The selected subject does not exist",
        field: "subjectId"
      };
    }

    // Validate academic year exists (if provided)
    if (scope.academicYearId) {
      const academicYear = await db.academicYear.findUnique({
        where: { id: scope.academicYearId },
        select: { id: true }
      });

      if (!academicYear) {
        return {
          isValid: false,
          error: "The selected academic year does not exist",
          field: "academicYearId"
        };
      }
    }

    // Validate class exists (if provided)
    if (scope.classId) {
      const classRecord = await db.class.findUnique({
        where: { id: scope.classId },
        select: { id: true }
      });

      if (!classRecord) {
        return {
          isValid: false,
          error: "The selected class does not exist",
          field: "classId"
        };
      }
    }

    // Validate section exists and belongs to the class (if provided)
    if (scope.sectionId) {
      const section = await db.classSection.findUnique({
        where: { id: scope.sectionId },
        select: { id: true, classId: true }
      });

      if (!section) {
        return {
          isValid: false,
          error: "The selected section does not exist",
          field: "sectionId"
        };
      }

      if (scope.classId && section.classId !== scope.classId) {
        return {
          isValid: false,
          error: "The selected section does not belong to the selected class",
          field: "sectionId"
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    console.error("Error validating syllabus scope:", error);
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Failed to validate syllabus scope"
    };
  }
}

// Get syllabus by subject ID
export async function getSyllabusBySubject(subjectId: string) {
  try {
    const syllabus = await db.syllabus.findFirst({
      where: {
        subjectId: subjectId
      },
      include: {
        subject: {
          select: {
            name: true,
            code: true,
          }
        },
        units: {
          orderBy: {
            order: 'asc',
          },
          include: {
            lessons: true
          }
        }
      }
    });

    if (!syllabus) {
      return { success: true, data: null };
    }

    return { success: true, data: syllabus };
  } catch (error) {
    console.error("Error fetching syllabus:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch syllabus"
    };
  }
}

// Create a new syllabus
export async function createSyllabus(data: SyllabusFormValues, file?: File | null, userId?: string) {
  try {
    // Determine scope fields based on scopeType
    let classId: string | null = null;
    let sectionId: string | null = null;

    if (data.scopeType === "CLASS_WIDE" || data.scopeType === "SECTION_SPECIFIC") {
      classId = data.classId || null;
    }

    if (data.scopeType === "SECTION_SPECIFIC") {
      sectionId = data.sectionId || null;
    }

    // Check for duplicate scope combination (unique constraint validation)
    const existingSyllabus = await db.syllabus.findFirst({
      where: {
        subjectId: data.subjectId,
        academicYearId: data.academicYearId || null,
        classId: classId,
        sectionId: sectionId,
        curriculumType: data.curriculumType || "GENERAL"
      }
    });

    if (existingSyllabus) {
      return {
        success: false,
        error: "A syllabus already exists for this combination of subject, academic year, class, section, and curriculum type"
      };
    }

    // Upload file to Cloudinary if provided
    let documentUrl = data.document;
    if (file) {
      const resourceType = getResourceType(file.type);
      const uploadResult = await uploadToCloudinary(file, {
        folder: 'syllabus',
        resource_type: resourceType,
        publicId: `${data.subjectId}_syllabus_${Date.now()}`
      });

      if (uploadResult.secure_url) {
        documentUrl = uploadResult.secure_url;
      }
    }

    // Create syllabus with enhanced fields
    const syllabus = await db.syllabus.create({
      data: {
        // Basic info
        title: data.title,
        description: data.description,
        subjectId: data.subjectId,
        document: documentUrl,

        // Scope fields
        academicYearId: data.academicYearId || null,
        classId: classId,
        sectionId: sectionId,

        // Curriculum details
        curriculumType: data.curriculumType || "GENERAL",
        boardType: data.boardType || null,

        // Lifecycle management (defaults)
        status: "DRAFT",
        isActive: true,
        effectiveFrom: data.effectiveFrom || null,
        effectiveTo: data.effectiveTo || null,

        // Versioning
        version: data.version || "1.0",
        parentSyllabusId: null,

        // Ownership
        createdBy: userId || "system",

        // Metadata
        tags: data.tags || [],
        difficultyLevel: data.difficultyLevel || "INTERMEDIATE",
        estimatedHours: data.estimatedHours || null,
        prerequisites: data.prerequisites || null,
      }
    });

    revalidatePath("/admin/academic/syllabus");
    return { success: true, data: syllabus };
  } catch (error) {
    console.error("Error creating syllabus:", error);

    // Handle Prisma unique constraint violation
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return {
        success: false,
        error: "A syllabus already exists for this combination"
      };
    }

    // Handle foreign key constraint violation
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return {
        success: false,
        error: "One or more selected references (subject, class, section, academic year) do not exist"
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create syllabus"
    };
  }
}

// Get syllabus with fallback logic (section → class → subject)
export async function getSyllabusWithFallback(scope: {
  subjectId: string;
  academicYearId?: string;
  classId?: string;
  sectionId?: string;
  curriculumType?: string;
}) {
  try {
    const { subjectId, academicYearId, classId, sectionId, curriculumType } = scope;
    const currentDate = new Date();

    // Build query conditions in priority order
    const conditions: Prisma.SyllabusWhereInput[] = [];

    // 1. Most specific: exact match (section-specific)
    if (sectionId && classId) {
      conditions.push({
        subjectId,
        academicYearId: academicYearId || null,
        classId,
        sectionId,
        curriculumType: (curriculumType as CurriculumType) || CurriculumType.GENERAL,
        status: "PUBLISHED",
        isActive: true,
        OR: [
          { effectiveFrom: null, effectiveTo: null },
          {
            AND: [
              { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: currentDate } }] },
              { OR: [{ effectiveTo: null }, { effectiveTo: { gte: currentDate } }] }
            ]
          }
        ]
      });
    }

    // 2. Class-wide (all sections)
    if (classId) {
      conditions.push({
        subjectId,
        academicYearId: academicYearId || null,
        classId,
        sectionId: null,
        curriculumType: (curriculumType as CurriculumType) || CurriculumType.GENERAL,
        status: "PUBLISHED",
        isActive: true,
        OR: [
          { effectiveFrom: null, effectiveTo: null },
          {
            AND: [
              { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: currentDate } }] },
              { OR: [{ effectiveTo: null }, { effectiveTo: { gte: currentDate } }] }
            ]
          }
        ]
      });
    }

    // 3. Subject-wide (all classes and sections)
    conditions.push({
      subjectId,
      academicYearId: null,
      classId: null,
      sectionId: null,
      curriculumType: (curriculumType as CurriculumType) || CurriculumType.GENERAL,
      status: "PUBLISHED",
      isActive: true,
      OR: [
        { effectiveFrom: null, effectiveTo: null },
        {
          AND: [
            { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: currentDate } }] },
            { OR: [{ effectiveTo: null }, { effectiveTo: { gte: currentDate } }] }
          ]
        }
      ]
    });

    // Try each condition in order
    for (const condition of conditions) {
      const syllabus = await db.syllabus.findFirst({
        where: condition,
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            }
          },
          academicYear: {
            select: {
              id: true,
              name: true,
            }
          },
          class: {
            select: {
              id: true,
              name: true,
            }
          },
          section: {
            select: {
              id: true,
              name: true,
            }
          },
          units: {
            orderBy: {
              order: 'asc',
            },
            include: {
              lessons: true
            }
          },
          modules: true,
        }
      });

      if (syllabus) {
        return { success: true, data: syllabus };
      }
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("Error fetching syllabus with fallback:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch syllabus"
    };
  }
}

// Get syllabi by scope with filtering
export async function getSyllabusByScope(filters: SyllabusScopeFilterValues) {
  try {
    const currentDate = filters.effectiveDate || new Date();

    // Build where clause
    const where: Prisma.SyllabusWhereInput = {};

    if (filters.subjectId) {
      where.subjectId = filters.subjectId;
    }

    if (filters.academicYearId) {
      where.academicYearId = filters.academicYearId;
    }

    if (filters.classId) {
      where.classId = filters.classId;
    }

    if (filters.sectionId) {
      where.sectionId = filters.sectionId;
    }

    if (filters.curriculumType) {
      where.curriculumType = filters.curriculumType;
    }

    if (filters.boardType) {
      where.boardType = filters.boardType;
    }

    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    // Add effective date filtering
    if (filters.effectiveDate) {
      where.OR = [
        { effectiveFrom: null, effectiveTo: null },
        {
          AND: [
            { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: currentDate } }] },
            { OR: [{ effectiveTo: null }, { effectiveTo: { gte: currentDate } }] }
          ]
        }
      ];
    }

    const syllabi = await db.syllabus.findMany({
      where,
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        academicYear: {
          select: {
            id: true,
            name: true,
          }
        },
        class: {
          select: {
            id: true,
            name: true,
          }
        },
        section: {
          select: {
            id: true,
            name: true,
          }
        },
        units: {
          orderBy: {
            order: 'asc',
          },
          include: {
            lessons: true
          }
        },
        modules: true,
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    return { success: true, data: syllabi };
  } catch (error) {
    console.error("Error fetching syllabi by scope:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch syllabi"
    };
  }
}

// Update an existing syllabus
export async function updateSyllabus(data: SyllabusUpdateFormValues & { id: string }, file?: File | null, userId?: string) {
  try {
    // Determine scope fields based on scopeType
    let classId: string | null = null;
    let sectionId: string | null = null;

    if (data.scopeType === "CLASS_WIDE" || data.scopeType === "SECTION_SPECIFIC") {
      classId = data.classId || null;
    }

    if (data.scopeType === "SECTION_SPECIFIC") {
      sectionId = data.sectionId || null;
    }

    // Upload file to Cloudinary if provided
    let documentUrl = data.document;
    if (file) {
      const resourceType = getResourceType(file.type);
      const uploadResult = await uploadToCloudinary(file, {
        folder: 'syllabus',
        resource_type: resourceType,
        publicId: `${data.subjectId}_syllabus_${Date.now()}`
      });

      if (uploadResult.secure_url) {
        documentUrl = uploadResult.secure_url;
      }
    }

    const syllabus = await db.syllabus.update({
      where: { id: data.id },
      data: {
        // Basic info
        title: data.title,
        description: data.description,
        subjectId: data.subjectId,
        document: documentUrl,

        // Scope fields
        academicYearId: data.academicYearId || null,
        classId: classId,
        sectionId: sectionId,

        // Curriculum details
        curriculumType: data.curriculumType || "GENERAL",
        boardType: data.boardType || null,

        // Scheduling
        effectiveFrom: data.effectiveFrom || null,
        effectiveTo: data.effectiveTo || null,

        // Versioning
        version: data.version || "1.0",

        // Ownership
        updatedBy: userId || null,

        // Metadata
        tags: data.tags || [],
        difficultyLevel: data.difficultyLevel || "INTERMEDIATE",
        estimatedHours: data.estimatedHours || null,
        prerequisites: data.prerequisites || null,
      }
    });

    revalidatePath("/admin/academic/syllabus");
    return { success: true, data: syllabus };
  } catch (error) {
    console.error("Error updating syllabus:", error);

    // Handle foreign key constraint violation
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return {
        success: false,
        error: "One or more selected references (subject, class, section, academic year) do not exist"
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update syllabus"
    };
  }
}

// Update syllabus status
export async function updateSyllabusStatus(
  syllabusId: string,
  status: SyllabusStatus,
  userId: string
) {
  try {
    const updateData: Prisma.SyllabusUpdateInput = {
      status,
      updatedBy: userId,
    };

    // Set approvedBy and approvedAt when status changes to APPROVED
    if (status === "APPROVED") {
      updateData.approvedBy = userId;
      updateData.approvedAt = new Date();
    }

    const syllabus = await db.syllabus.update({
      where: { id: syllabusId },
      data: updateData,
    });

    revalidatePath("/admin/academic/syllabus");
    return { success: true, data: syllabus };
  } catch (error) {
    console.error("Error updating syllabus status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update syllabus status"
    };
  }
}

// Clone syllabus
export async function cloneSyllabus(
  sourceId: string,
  newScope: {
    academicYearId?: string;
    classId?: string;
    sectionId?: string;
    curriculumType?: string;
  },
  userId: string
) {
  try {
    // Get source syllabus with all relations
    const source = await db.syllabus.findUnique({
      where: { id: sourceId },
      include: {
        units: {
          include: {
            lessons: true
          }
        },
        modules: true,
      }
    });

    if (!source) {
      return {
        success: false,
        error: "Source syllabus not found"
      };
    }

    // Check for duplicate scope combination
    const existingSyllabus = await db.syllabus.findFirst({
      where: {
        subjectId: source.subjectId,
        academicYearId: newScope.academicYearId || null,
        classId: newScope.classId || null,
        sectionId: newScope.sectionId || null,
        curriculumType: (newScope.curriculumType as CurriculumType) || source.curriculumType
      }
    });

    if (existingSyllabus) {
      return {
        success: false,
        error: "A syllabus already exists for this combination"
      };
    }

    // Clone syllabus with new scope
    const clonedSyllabus = await db.syllabus.create({
      data: {
        // Copy all fields except id, createdAt, updatedAt
        title: source.title,
        description: source.description,
        subjectId: source.subjectId,
        document: source.document,

        // New scope
        academicYearId: newScope.academicYearId || null,
        classId: newScope.classId || null,
        sectionId: newScope.sectionId || null,

        // Copy curriculum details
        curriculumType: (newScope.curriculumType as CurriculumType) || source.curriculumType,
        boardType: source.boardType,

        // Reset lifecycle to DRAFT
        status: "DRAFT",
        isActive: true,
        effectiveFrom: source.effectiveFrom,
        effectiveTo: source.effectiveTo,

        // Copy versioning
        version: source.version,
        parentSyllabusId: source.id, // Link to parent

        // Set new ownership
        createdBy: userId,

        // Copy metadata
        tags: source.tags,
        difficultyLevel: source.difficultyLevel,
        estimatedHours: source.estimatedHours,
        prerequisites: source.prerequisites,
      }
    });

    // Clone units and lessons
    for (const unit of source.units) {
      const clonedUnit = await db.syllabusUnit.create({
        data: {
          title: unit.title,
          description: unit.description,
          order: unit.order,
          syllabusId: clonedSyllabus.id,
        }
      });

      // Clone lessons for this unit
      for (const lesson of unit.lessons) {
        await db.lesson.create({
          data: {
            title: lesson.title,
            description: lesson.description,
            content: lesson.content,
            resources: lesson.resources,
            duration: lesson.duration,
            subjectId: lesson.subjectId,
            syllabusUnitId: clonedUnit.id,
          }
        });
      }
    }

    revalidatePath("/admin/academic/syllabus");
    return { success: true, data: clonedSyllabus };
  } catch (error) {
    console.error("Error cloning syllabus:", error);

    // Handle Prisma unique constraint violation
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return {
        success: false,
        error: "A syllabus already exists for this combination"
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to clone syllabus"
    };
  }
}

// Get syllabus version history
export async function getSyllabusVersionHistory(syllabusId: string) {
  try {
    const versions: any[] = [];

    // Helper function to recursively get all versions
    async function getVersionChain(id: string) {
      const syllabus = await db.syllabus.findUnique({
        where: { id },
        include: {
          subject: {
            select: {
              name: true,
              code: true,
            }
          },
          childVersions: true,
        }
      });

      if (syllabus) {
        versions.push(syllabus);

        // Get all child versions
        for (const child of syllabus.childVersions) {
          await getVersionChain(child.id);
        }
      }
    }

    // Start from the requested syllabus
    await getVersionChain(syllabusId);

    // Also get parent versions
    let currentId = syllabusId;
    while (true) {
      const current = await db.syllabus.findUnique({
        where: { id: currentId },
        select: {
          parentSyllabusId: true,
          parentSyllabus: {
            include: {
              subject: {
                select: {
                  name: true,
                  code: true,
                }
              }
            }
          }
        }
      });

      if (!current || !current.parentSyllabusId || !current.parentSyllabus) {
        break;
      }

      // Add parent if not already in versions
      if (!versions.find(v => v.id === current.parentSyllabus!.id)) {
        versions.unshift(current.parentSyllabus);
      }

      currentId = current.parentSyllabusId;
    }

    return { success: true, data: versions };
  } catch (error) {
    console.error("Error fetching syllabus version history:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch version history"
    };
  }
}

// Delete a syllabus
export async function deleteSyllabus(id: string) {
  try {
    // This will cascade delete all related units and lessons
    await db.syllabus.delete({
      where: { id }
    });

    revalidatePath("/admin/academic/syllabus");
    return { success: true };
  } catch (error) {
    console.error("Error deleting syllabus:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete syllabus"
    };
  }
}

// Create a new syllabus unit
export async function createSyllabusUnit(data: SyllabusUnitFormValues) {
  try {
    const unit = await db.syllabusUnit.create({
      data: {
        title: data.title,
        description: data.description,
        syllabusId: data.syllabusId,
        order: data.order,
      }
    });

    revalidatePath("/admin/academic/syllabus");
    return { success: true, data: unit };
  } catch (error) {
    console.error("Error creating syllabus unit:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create syllabus unit"
    };
  }
}

// Update an existing syllabus unit
export async function updateSyllabusUnit(data: SyllabusUnitUpdateFormValues) {
  try {
    const unit = await db.syllabusUnit.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description,
        order: data.order,
        syllabusId: data.syllabusId,
      }
    });

    revalidatePath("/admin/academic/syllabus");
    return { success: true, data: unit };
  } catch (error) {
    console.error("Error updating syllabus unit:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update syllabus unit"
    };
  }
}

// Delete a syllabus unit
export async function deleteSyllabusUnit(id: string) {
  try {
    // This will cascade delete all related lessons
    await db.syllabusUnit.delete({
      where: { id }
    });

    revalidatePath("/admin/academic/syllabus");
    return { success: true };
  } catch (error) {
    console.error("Error deleting syllabus unit:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete syllabus unit"
    };
  }
}

// Create a new lesson
export async function createLesson(data: LessonFormValues) {
  try {
    const lesson = await db.lesson.create({
      data: {
        title: data.title,
        description: data.description,
        subjectId: data.subjectId,
        syllabusUnitId: data.syllabusUnitId,
        content: data.content,
        resources: data.resources,
        duration: data.duration,
      }
    });

    revalidatePath("/admin/academic/syllabus");
    return { success: true, data: lesson };
  } catch (error) {
    console.error("Error creating lesson:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create lesson"
    };
  }
}

// Update an existing lesson
export async function updateLesson(data: LessonUpdateFormValues) {
  try {
    const lesson = await db.lesson.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description,
        subjectId: data.subjectId,
        syllabusUnitId: data.syllabusUnitId,
        content: data.content,
        resources: data.resources,
        duration: data.duration,
      }
    });

    revalidatePath("/admin/academic/syllabus");
    return { success: true, data: lesson };
  } catch (error) {
    console.error("Error updating lesson:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update lesson"
    };
  }
}

// Delete a lesson
export async function deleteLesson(id: string) {
  try {
    await db.lesson.delete({
      where: { id }
    });

    revalidatePath("/admin/academic/syllabus");
    return { success: true };
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete lesson"
    };
  }
}

// Get maximum order for a syllabus
export async function getMaxUnitOrder(syllabusId: string) {
  try {
    const result = await db.syllabusUnit.findMany({
      where: { syllabusId: syllabusId },
      orderBy: { order: 'desc' },
      take: 1,
      select: { order: true }
    });

    const maxOrder = result.length > 0 ? result[0].order : 0;
    return { success: true, data: maxOrder };
  } catch (error) {
    console.error("Error fetching max unit order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch max unit order"
    };
  }
}
