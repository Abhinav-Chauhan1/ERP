"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { SubjectFormValues, SubjectUpdateFormValues } from "../schemaValidation/curriculumSchemaValidation";

// Get all subjects with department info
export async function getSubjects() {
  try {
    const subjects = await db.subject.findMany({
      include: {
        department: true,
        classes: {
          include: {
            class: true,
          }
        },
        syllabus: {
          select: {
            id: true,
          }
        }
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform the data to match the expected format in the UI
    const transformedSubjects = subjects.map(subject => ({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      description: subject.description || "",
      department: subject.department?.name || "",
      departmentId: subject.departmentId || "",
      classes: subject.classes.map(sc => sc.class.name),
      classIds: subject.classes.map(sc => sc.classId),
      hasComplexSyllabus: subject.syllabus.length > 0
    }));
    
    return { success: true, data: transformedSubjects };
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch subjects" 
    };
  }
}

// Get a single subject by ID
export async function getSubjectById(id: string) {
  try {
    const subject = await db.subject.findUnique({
      where: { id },
      include: {
        department: true,
        classes: {
          include: {
            class: true,
          }
        },
        syllabus: true
      }
    });
    
    if (!subject) {
      return { success: false, error: "Subject not found" };
    }
    
    return { success: true, data: subject };
  } catch (error) {
    console.error("Error fetching subject:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch subject" 
    };
  }
}

// Get all departments
export async function getDepartments() {
  try {
    const departments = await db.department.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    
    return { success: true, data: departments };
  } catch (error) {
    console.error("Error fetching departments:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch departments" 
    };
  }
}

// Get all classes
export async function getClasses() {
  try {
    const classes = await db.class.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        academicYear: {
          select: {
            name: true,
            isCurrent: true
          }
        }
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

// Create a new subject
export async function createSubject(data: SubjectFormValues) {
  try {
    // Check if subject code already exists
    const existingSubject = await db.subject.findUnique({
      where: { code: data.code }
    });

    if (existingSubject) {
      return { success: false, error: "Subject code already exists" };
    }

    // Create new subject with class connections
    const subject = await db.subject.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        departmentId: data.departmentId,
        classes: {
          create: data.classIds.map(classId => ({
            class: { connect: { id: classId } }
          }))
        }
      }
    });
    
    revalidatePath("/admin/academic/curriculum");
    return { success: true, data: subject };
  } catch (error) {
    console.error("Error creating subject:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create subject" 
    };
  }
}

// Update an existing subject
export async function updateSubject(data: SubjectUpdateFormValues) {
  try {
    // Check if subject code already exists for another subject
    const existingSubject = await db.subject.findFirst({
      where: { 
        code: data.code,
        id: { not: data.id }
      }
    });

    if (existingSubject) {
      return { success: false, error: "Subject code already exists" };
    }

    // First, delete all existing class connections
    await db.subjectClass.deleteMany({
      where: { subjectId: data.id }
    });

    // Update subject with new data and class connections
    const subject = await db.subject.update({
      where: { id: data.id },
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        departmentId: data.departmentId,
        classes: {
          create: data.classIds.map(classId => ({
            class: { connect: { id: classId } }
          }))
        }
      }
    });
    
    revalidatePath("/admin/academic/curriculum");
    return { success: true, data: subject };
  } catch (error) {
    console.error("Error updating subject:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update subject" 
    };
  }
}

// Delete a subject
export async function deleteSubject(id: string) {
  try {
    // Check if subject has any teachers or syllabus
    const hasSyllabus = await db.syllabus.findFirst({ where: { subjectId: id } });
    const hasTeachers = await db.subjectTeacher.findFirst({ where: { subjectId: id } });
    
    if (hasSyllabus || hasTeachers) {
      return {
        success: false,
        error: "Cannot delete this subject because it has associated syllabi or teachers. Remove them first."
      };
    }
    
    // Delete the subject and its class connections (cascade delete)
    await db.subject.delete({
      where: { id }
    });
    
    revalidatePath("/admin/academic/curriculum");
    return { success: true };
  } catch (error) {
    console.error("Error deleting subject:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete subject" 
    };
  }
}
