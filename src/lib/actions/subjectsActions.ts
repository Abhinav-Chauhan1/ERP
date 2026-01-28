"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { PermissionAction } from "@prisma/client";
import { hasPermission } from "@/lib/utils/permissions";
import { SubjectFormValues, SubjectUpdateFormValues } from "../schemaValidation/subjectsSchemaValidation";
import { STANDARD_SUBJECTS } from "@/lib/constants/academic-standards";
import { withSchoolAuthAction } from "../auth/security-wrapper";

// Helper to check permission and throw if denied
async function checkPermission(userId: string, resource: string, action: PermissionAction, errorMessage?: string) {
  const allowed = await hasPermission(userId, resource, action);
  if (!allowed) {
    throw new Error(errorMessage || `Permission denied: Cannot ${action} ${resource}`);
  }
}

// Get all subjects with their relationships
export const getSubjects = withSchoolAuthAction(async (schoolId) => {
  try {
    const subjects = await db.subject.findMany({
      where: { schoolId },
      include: {
        classes: {
          where: { class: { schoolId } },
          include: {
            class: {
              include: {
                academicYear: true
              }
            }
          }
        },
        teachers: {
          include: {
            teacher: {
              include: {
                user: true
              }
            }
          }
        },
        syllabus: {
          where: { schoolId },
          include: {
            units: true
          }
        }
      },
      orderBy: {
        name: 'asc',
      },
    });

    const formattedSubjects = subjects.map(subject => ({
      id: subject.id,
      code: subject.code,
      name: subject.name,
      description: subject.description || "",
      hasLabs: subject.description?.toLowerCase().includes("lab") || false,
      grades: subject.classes.map(sc => sc.class.name),
      classIds: subject.classes.map(sc => sc.classId),
      classes: subject.classes.length,
      teachers: subject.teachers.length,
      hasComplexSyllabus: subject.syllabus.length > 0 && subject.syllabus[0].units.length > 0
    }));

    return { success: true, data: formattedSubjects };
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch subjects"
    };
  }
});

// Get a single subject by ID with all related data
export const getSubjectById = withSchoolAuthAction(async (schoolId, userId, userRole, id: string) => {
  try {
    const subject = await db.subject.findFirst({
      where: { id, schoolId },
      include: {
        classes: {
          where: { class: { schoolId } },
          include: {
            class: {
              include: {
                academicYear: true
              }
            }
          }
        },
        teachers: {
          include: {
            teacher: {
              include: {
                user: true,
                classes: {
                  include: {
                    class: true,
                  }
                }
              }
            }
          }
        },
        syllabus: {
          where: { schoolId },
          include: {
            units: {
              include: {
                lessons: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      }
    });

    if (!subject) {
      return { success: false, error: "Subject not found" };
    }

    // Format teachers data
    const teachersData = subject.teachers.map(st => ({
      id: st.teacher.id,
      name: `${st.teacher.user.firstName} ${st.teacher.user.lastName}`,
      avatar: st.teacher.user.avatar,
      qualification: st.teacher.qualification || "",
      classes: st.teacher.classes.map(ct => `${ct.class.name} ${ct.isClassHead ? '(Head)' : ''}`)
    }));

    // Format classes data
    const classesData = subject.classes.map(sc => {
      const teacherForClass = subject.teachers.find(st =>
        st.teacher.classes.some(tc => tc.classId === sc.classId)
      );

      return {
        id: sc.classId,
        name: sc.class.name,
        students: 0,
        teacher: teacherForClass ?
          `${teacherForClass.teacher.user.firstName} ${teacherForClass.teacher.user.lastName}` :
          "Not assigned",
        academicYear: sc.class.academicYear.name,
        isCurrent: sc.class.academicYear.isCurrent
      };
    });

    // Format syllabus data
    let syllabusData = null;
    if (subject.syllabus.length > 0) {
      const mainSyllabus = subject.syllabus[0];
      syllabusData = {
        id: mainSyllabus.id,
        title: mainSyllabus.title,
        description: mainSyllabus.description,
        units: mainSyllabus.units.map(unit => ({
          id: unit.id,
          title: unit.title,
          description: unit.description,
          order: unit.order,
          lessons: unit.lessons.map(lesson => ({
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            duration: lesson.duration ? `${lesson.duration} mins` : "Not specified"
          }))
        }))
      };
    }

    const resourcesData = subject.syllabus.map(syl => ({
      id: syl.id,
      name: syl.title || "Subject Materials",
      type: "PDF",
      link: syl.document || "#"
    }));

    const formattedSubject = {
      id: subject.id,
      code: subject.code,
      name: subject.name,
      description: subject.description || "",
      hasLabs: subject.description?.toLowerCase().includes("lab") || false,
      grades: subject.classes.map(sc => sc.class.name),
      classIds: subject.classes.map(sc => sc.classId),
      teachers: teachersData,
      classes: classesData,
      syllabus: syllabusData,
      resources: resourcesData
    };

    return { success: true, data: formattedSubject };
  } catch (error) {
    console.error("Error fetching subject:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch subject"
    };
  }
});

// Get all departments for the dropdown


// Get all classes for the dropdown
export const getClasses = withSchoolAuthAction(async (schoolId) => {
  try {
    const classes = await db.class.findMany({
      where: { schoolId },
      include: {
        academicYear: true,
      },
      orderBy: [
        { academicYear: { isCurrent: 'desc' } },
        { name: 'asc' },
      ],
    });

    return { success: true, data: classes };
  } catch (error) {
    console.error("Error fetching classes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch classes"
    };
  }
});

// Create a new subject
export const createSubject = withSchoolAuthAction(async (schoolId, userId, userRole, data: SubjectFormValues) => {
  try {
    // Permission check: require SUBJECT:CREATE
    await checkPermission(userId, 'SUBJECT', 'CREATE', 'You do not have permission to create subjects');

    // Check if subject code already exists
    const existingSubject = await db.subject.findFirst({
      where: {
        schoolId,
        code: {
          equals: data.code,
          mode: 'insensitive'
        }
      }
    });

    if (existingSubject) {
      return { success: false, error: "A subject with this code already exists" };
    }

    // Create the subject with class connections
    const subject = await db.subject.create({
      data: {
        schoolId,
        name: data.name,
        code: data.code,
        description: data.description,
        classes: {
          create: data.classIds.map(classId => ({
            class: { connect: { id: classId } }
          }))
        }
      }
    });

    revalidatePath("/admin/teaching/subjects");
    return { success: true, data: subject };
  } catch (error) {
    console.error("Error creating subject:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create subject"
    };
  }
});

// Update an existing subject
export const updateSubject = withSchoolAuthAction(async (schoolId, userId, userRole, data: SubjectUpdateFormValues) => {
  try {
    // Permission check: require SUBJECT:UPDATE
    await checkPermission(userId, 'SUBJECT', 'UPDATE', 'You do not have permission to update subjects');

    // Check if subject code already exists for another subject
    const existingSubject = await db.subject.findFirst({
      where: {
        schoolId,
        code: {
          equals: data.code,
          mode: 'insensitive'
        },
        id: { not: data.id }
      }
    });

    if (existingSubject) {
      return { success: false, error: "A subject with this code already exists" };
    }

    // First, delete all existing class connections
    await db.subjectClass.deleteMany({
      where: {
        subjectId: data.id,
        subject: { schoolId }
      }
    });

    // Update the subject with new class connections
    const subject = await db.subject.update({
      where: { id: data.id, schoolId },
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        classes: {
          create: data.classIds.map(classId => ({
            class: { connect: { id: classId } }
          }))
        }
      }
    });

    revalidatePath("/admin/teaching/subjects");
    revalidatePath(`/admin/teaching/subjects/${data.id}`);
    return { success: true, data: subject };
  } catch (error) {
    console.error("Error updating subject:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update subject"
    };
  }
});

// Delete a subject
export const deleteSubject = withSchoolAuthAction(async (schoolId, userId, userRole, id: string) => {
  try {
    // Check for dependencies before deleting
    const hasSyllabus = await db.syllabus.findFirst({ where: { subjectId: id, schoolId } });
    const hasTeachers = await db.subjectTeacher.findFirst({ where: { subjectId: id, subject: { schoolId } } });
    const hasExams = await db.exam.findFirst({ where: { subjectId: id, schoolId } });
    const hasAssignments = await db.assignment.findFirst({ where: { subjectId: id, schoolId } });

    if (hasSyllabus || hasTeachers || hasExams || hasAssignments) {
      return {
        success: false,
        error: "Cannot delete this subject because it has associated syllabi, teachers, exams, or assignments. Remove these first."
      };
    }

    // Delete the subject (this will cascade delete subject-class connections)
    await db.subject.delete({
      where: { id, schoolId }
    });

    revalidatePath("/admin/teaching/subjects");
    return { success: true };
  } catch (error) {
    console.error("Error deleting subject:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete subject"
    };
  }
});



// Get available subjects to generate (those not already created)
export async function getAvailableSubjectTemplates() {
  try {
    const existingSubjects = await db.subject.findMany({
      select: { code: true }
    });
    const existingCodes = new Set(existingSubjects.map(s => s.code.toUpperCase()));

    const available = STANDARD_SUBJECTS.filter(
      s => !existingCodes.has(s.code.toUpperCase())
    );

    return { success: true, data: available };
  } catch (error) {
    console.error("Error fetching available subject templates:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch templates"
    };
  }
}

// Auto-generate selected subjects
export const autoGenerateSubjects = withSchoolAuthAction(async (schoolId, userId, userRole, selectedCodes?: string[]) => {
  try {
    // Get existing subjects
    const existingSubjects = await db.subject.findMany({
      where: { schoolId },
      select: { code: true }
    });
    const existingCodes = new Set(existingSubjects.map(s => s.code.toUpperCase()));

    // Filter out subjects that already exist
    let subjectsToCreate = STANDARD_SUBJECTS
      .filter(s => !existingCodes.has(s.code.toUpperCase()));

    // If specific codes were provided, filter to only those
    if (selectedCodes && selectedCodes.length > 0) {
      const selectedSet = new Set(selectedCodes.map(c => c.toUpperCase()));
      subjectsToCreate = subjectsToCreate.filter(
        s => selectedSet.has(s.code.toUpperCase())
      );
    }

    if (subjectsToCreate.length === 0) {
      return {
        success: false,
        error: "No new subjects to create"
      };
    }

    // Create the new subjects
    const result = await db.subject.createMany({
      data: subjectsToCreate.map(s => ({
        schoolId,
        name: s.name,
        code: s.code,
        description: s.description,
      })),
      skipDuplicates: true,
    });

    revalidatePath("/admin/teaching/subjects");
    return {
      success: true,
      count: result.count,
      message: `Created ${result.count} subjects`
    };
  } catch (error) {
    console.error("Error auto-generating subjects:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to auto-generate subjects"
    };
  }
});


